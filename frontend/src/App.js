import React, { useState, useRef } from 'react';
import ForceGraph2D from 'react-force-graph-2d';

function App() {
  const [dadosGrafo, setDadosGrafo] = useState({ nodes: [], links: [] });
  const [erro, setErro] = useState(null);
  const [localizacao, setLocalizacao] = useState('');
  const [caminhos, setCaminhos] = useState([]);
  const [caminhoSelecionado, setCaminhoSelecionado] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const [arquivo, setArquivo] = useState(null);
  const refGrafo = useRef();

  // Carrega e processa um arquivo .txt com a descrição do grafo, validando o formato e construindo os nós e arestas para exibição.
  const carregarArquivo = (evento) => {
    // Inicializa os estados, limpando dados anteriores do grafo, caminhos, localização e erros.
    setDadosGrafo({ nodes: [], links: [] });
    setArquivo(null);
    setCaminhos([]);
    setCaminhoSelecionado(null);
    setLocalizacao('');
    setErro(null);

    // Obtém o arquivo selecionado pelo usuário a partir do evento de input.
    const arquivoSelecionado = evento.target.files[0];
    setArquivo(arquivoSelecionado);

    // Verifica se um arquivo foi selecionado, exibindo erro se não houver.
    if (!arquivoSelecionado) {
      setErro('Nenhum arquivo selecionado.');
      return;
    }

    // Confirma se o arquivo é do tipo texto (.txt), rejeitando outros formatos.
    if (arquivoSelecionado.type !== 'text/plain') {
      setErro('Por favor, envie um arquivo .txt');
      return;
    }

    // Configura o leitor de arquivo para processar o conteúdo do arquivo como texto.
    const leitor = new FileReader();
    leitor.onload = (e) => {
      const texto = e.target.result.trim();
      
      // Verifica se o arquivo está vazio, exibindo erro se não contiver dados.
      if (!texto) {
        setErro('O arquivo está vazio.');
        return;
      }

      // Processa o conteúdo do arquivo, validando e construindo o grafo.
      try {
        const linhas = texto.split('\n');
        const conjuntoNos = new Set();
        const mapaArestas = new Map();
        const paresArestas = new Set();

        // Itera sobre cada linha do arquivo para extrair nós e arestas.
        linhas.forEach(linha => {
          const [origem, destinos] = linha.split(':').map(s => s.trim());

          // Valida o formato da linha, exigindo origem e destinos.
          if (!origem || !destinos) {
            throw new Error(`Formato inválido na linha: ${linha}`);
          }

          // Verifica se o nome do vértice de origem é uma única letra válida.
          if (!origem.match(/^[A-Za-z]$/)) {
            throw new Error(`Nome do vértice "${origem}" inválido na linha: ${linha}. Use exatamente uma letra (A-Z, a-z).`);
          }

          // Processa cada destino e peso, validando e armazenando as arestas.
          destinos.split(',').forEach(parte => {
            const correspondencia = parte.trim().match(/^([A-Za-z]+)(\d+)$/);
            if (!correspondencia) {
              throw new Error(`Destino/peso inválido na linha: ${linha}`);
            }

            const [, destino, peso] = correspondencia;
            const pesoNumerico = parseInt(peso);

            // Valida se o vértice de destino é uma única letra.
            if (!destino.match(/^[A-Za-z]$/)) {
              throw new Error(`Nome do vértice "${destino}" inválido na linha: ${linha}. Use exatamente uma letra (A-Z, a-z).`);
            }

            // Gerencia arestas duplicadas, mantendo a de menor peso.
            const chaveAresta = `${origem}-${destino}`;
            if (mapaArestas.has(chaveAresta)) {
              const pesoExistente = mapaArestas.get(chaveAresta).weight;
              if (pesoNumerico < pesoExistente) {
                mapaArestas.set(chaveAresta, { origem, destino, weight: pesoNumerico });
              }
            } else {
              mapaArestas.set(chaveAresta, { origem, destino, weight: pesoNumerico });
            }

            // Adiciona os vértices ao conjunto de nós.
            conjuntoNos.add(origem);
            conjuntoNos.add(destino);
          });
        });

        // Converte as arestas processadas em formato compatível com o visualizador, ajustando curvaturas para arestas bidirecionais.
        const links = Array.from(mapaArestas.values()).map(({ origem, destino, weight }) => {
          const chavePar = [origem, destino].sort().join('-');
          const ehReverso = paresArestas.has(chavePar);
          paresArestas.add(chavePar);

          return {
            source: origem,
            target: destino,
            label: weight.toString(),
            value: weight,
            curvature: ehReverso ? 0.3 : 0
          };
        });

        // Cria a lista de nós para o grafo.
        const nodes = Array.from(conjuntoNos).map(id => ({ id }));
        
        // Atualiza o estado com os dados do grafo processado.
        setDadosGrafo({ nodes, links });
      } catch (err) {
        // Exibe mensagem de erro e limpa o grafo em caso de falha no processamento.
        setErro(err.message);
        setDadosGrafo({ nodes: [], links: [] });
      }
    };

    // Inicia a leitura do arquivo como texto.
    leitor.readAsText(arquivoSelecionado);
  };

  // Busca os caminhos possíveis a partir de uma localização inicial, enviando o grafo processado ao backend e atualizando a lista de caminhos encontrados.
  const buscarCaminhos = async () => {
    // Inicializa o estado de erro e ativa o indicador de carregamento.
    setErro(null);
    setCarregando(true);

    // Verifica se a localização foi informada.
    if (!localizacao) {
      setErro('Por favor, informe uma localização.');
      setCarregando(false);
      return;
    }

    // Valida se a localização é uma única letra válida.
    if (!localizacao.match(/^[A-Za-z]$/)) {
      setErro('A localização deve ser uma única letra (ex.: A).');
      setCarregando(false);
      return;
    }

    // Confirma se a localização corresponde a um nó existente no grafo.
    if (!dadosGrafo.nodes.some(no => no.id === localizacao)) {
      setErro('Localização inválida. Escolha um nó existente.');
      setCarregando(false);
      return;
    }

    // Verifica se o nó possui arestas de saída, rejeitando nós sem caminhos possíveis.
    const temArestasSaida = dadosGrafo.links.some(aresta => aresta.source.id === localizacao);
    if (!temArestasSaida) {
      setErro(`O nó ${localizacao} é um sumidouro. Não é possível calcular caminhos a partir dele.`);
      setCaminhos([]);
      setCaminhoSelecionado(null);
      setCarregando(false);
      return;
    }

    // Garante que um arquivo foi carregado antes de prosseguir.
    if (!arquivo) {
      setErro('Nenhum arquivo selecionado.');
      setCarregando(false);
      return;
    }

    // Envia a requisição ao backend com o grafo processado.
    try {
      // Constrói um arquivo limpo a partir dos dados do grafo, removendo arestas duplicadas.
      const arestasPorNo = {};
      dadosGrafo.links.forEach(aresta => {
        const origem = aresta.source.id || aresta.source;
        const destino = aresta.target.id || aresta.target;
        const peso = aresta.value;
        if (!arestasPorNo[origem]) {
          arestasPorNo[origem] = [];
        }
        arestasPorNo[origem].push(`${destino}${peso}`);
      });

      // Formata o conteúdo do arquivo no formato esperado (ex.: "A: B2, C3").
      const conteudoLimpo = Object.entries(arestasPorNo)
        .map(([origem, destinos]) => `${origem}: ${destinos.join(', ')}`)
        .join('\n');

      // Cria um novo arquivo com o conteúdo limpo para enviar ao backend.
      const arquivoLimpo = new Blob([conteudoLimpo], { type: 'text/plain' });
      const dadosFormulario = new FormData();
      dadosFormulario.append('arquivoGrafo', arquivoLimpo, arquivo.name);

      // Registra o conteúdo enviado para depuração.
      console.log('Enviando FormData com conteúdo limpo:', {
        verticeInicial: localizacao,
        arquivoGrafo: conteudoLimpo
      });

      // Faz a requisição POST ao backend para calcular os caminhos.
      const resposta = await fetch(`http://127.0.0.1:5000/custo?verticeInicial=${encodeURIComponent(localizacao)}`, {
        method: 'POST',
        body: dadosFormulario
      });

      // Verifica se a resposta do backend foi bem-sucedida.
      if (!resposta.ok) {
        const dadosErro = await resposta.json();
        console.error('Erro do servidor:', dadosErro);
        throw new Error(`Erro ${resposta.status}: ${dadosErro.detail}`);
      }

      // Atualiza os caminhos com os dados retornados pelo backend.
      const dados = await resposta.json();
      console.log('Resposta recebida:', dados);
      setCaminhos(dados.paths);
      setErro(null);
    } catch (err) {
      // Exibe mensagem de erro em caso de falha na requisição.
      console.error('Erro na requisição:', err);
      setErro(err.message);
    } finally {
      // Desativa o indicador de carregamento.
      setCarregando(false);
    }
  };

  // Define o caminho selecionado pelo usuário ao clicar em um item da lista de caminhos, destacando-o no grafo.
  const selecionarCaminho = (caminho) => {
    // Atualiza o estado com o caminho escolhido para destaque visual.
    setCaminhoSelecionado(caminho);
  };

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      padding: 20,
      boxSizing: 'border-box',
      maxWidth: '100%',
      overflow: 'hidden'
    }}>
      <div style={{
        width: '25%',
        paddingRight: 20,
        overflowY: 'auto',
        maxHeight: '100vh',
        scrollbarWidth: 'thin'
      }}>
        <h2 style={{ marginBottom: 20 }}>Visualizador de Grafos</h2>
        <div style={{ marginBottom: 20 }}>
          <input type="file" accept=".txt" onChange={carregarArquivo} />
          {erro && <p style={{ color: 'red', marginTop: 10 }}>{erro}</p>}
        </div>
        <div style={{ marginBottom: 20 }}>
          <p style={{ marginBottom: 10 }}>Informe a origem:</p>
          <input
            type="text"
            placeholder="Digite sua localização"
            value={localizacao}
            onChange={(e) => setLocalizacao(e.target.value.trim())}
            style={{ width: '95%', padding: 8, border: '1px solid #ccc', borderRadius: 4 }}
          />
          <button
            onClick={buscarCaminhos}
            disabled={carregando}
            style={{
              width: '100%',
              padding: 8,
              marginTop: 10,
              backgroundColor: carregando ? '#ccc' : '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: 4,
              cursor: carregando ? 'not-allowed' : 'pointer'
            }}
          >
            {carregando ? 'Buscando...' : 'Buscar Rotas'}
          </button>
        </div>
        {caminhos.length > 0 && (
          <div>
            <h3 style={{ marginBottom: 10 }}>Caminhos Encontrados (Origem: {localizacao})</h3>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {caminhos.map((caminho, indice) => (
                <li
                  key={indice}
                  onClick={() => selecionarCaminho(caminho)}
                  style={{
                    padding: 10,
                    marginBottom: 5,
                    backgroundColor: caminhoSelecionado === caminho ? '#e0f7fa' : '#f5f5f5',
                    borderRadius: 4,
                    cursor: 'pointer',
                    border: '1px solid #ddd'
                  }}
                >
                  <strong>Destino: {caminho.target}</strong><br />
                  Caminho: {caminho.path.join(' -> ')}<br />
                  Custo: {caminho.cost}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <div style={{
        position: 'fixed',
        top: 20,
        right: 20,
        width: 'calc(75% - 40px)',
        height: 'calc(100vh - 40px)',
        border: '1px solid #ccc',
        overflow: 'hidden'
      }}>
        <style>
          {`
            div::-webkit-scrollbar {
              display: none;
            }
          `}
        </style>
        <ForceGraph2D
          ref={refGrafo}
          graphData={dadosGrafo}
          nodeAutoColorBy="id"
          linkDirectionalArrowLength={6}
          linkDirectionalArrowRelPos={1}
          linkLabel={aresta => `peso: ${aresta.label}`}
          linkCurvature={aresta => aresta.curvature || 0}
          linkLineWidth={aresta => {
            if (!caminhoSelecionado) return 1;
            for (let i = 0; i < caminhoSelecionado.path.length - 1; i++) {
              const origem = caminhoSelecionado.path[i];
              const destino = caminhoSelecionado.path[i + 1];
              if (aresta.source.id === origem && aresta.target.id === destino) {
                return 3;
              }
            }
            return 1;
          }}
          linkColor={aresta => {
            if (!caminhoSelecionado) return 'gray';
            for (let i = 0; i < caminhoSelecionado.path.length - 1; i++) {
              const origem = caminhoSelecionado.path[i];
              const destino = caminhoSelecionado.path[i + 1];
              if (aresta.source.id === origem && aresta.target.id === destino) {
                return 'red';
              }
            }
            return 'gray';
          }}
          linkCanvasObjectMode={() => 'after'}
          linkCanvasObject={(aresta, ctx) => {
            const rotulo = `${aresta.label}`;
            if (!rotulo) return;

            const curvatura = aresta.curvature || 0;
            const inicioX = aresta.source.x;
            const inicioY = aresta.source.y;
            const fimX = aresta.target.x;
            const fimY = aresta.target.y;

            if (curvatura === 0) {
              const meioX = (inicioX + fimX) / 2;
              const meioY = (inicioY + fimY) / 2;

              ctx.font = '4px Arial';
              ctx.fillStyle = 'white';
              ctx.lineWidth = 0;
              ctx.strokeText(rotulo, meioX, meioY);
              ctx.fillText(rotulo, meioX, meioY);
            } else {
              const dx = fimX - inicioX;
              const dy = fimY - inicioY;
              const distancia = Math.sqrt(dx * dx + dy * dy);
              const meioX = (inicioX + fimX) / 2;
              const meioY = (inicioY + fimY) / 2;

              const nx = -dy / distancia;
              const ny = dx / distancia;
              const deslocamentoCurva = curvatura * distancia * (-0.5);

              const rotuloX = meioX + nx * deslocamentoCurva;
              const rotuloY = meioY + ny * deslocamentoCurva;

              ctx.font = '4px Arial';
              ctx.fillStyle = 'white';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.strokeText(rotulo, rotuloX, rotuloY);
              ctx.fillText(rotulo, rotuloX, rotuloY);
            }
          }}
          nodeCanvasObject={(no, ctx, escalaGlobal) => {
            const rotulo = no.id;
            const raio = 5;

            ctx.beginPath();
            ctx.arc(no.x, no.y, raio, 0, 2 * Math.PI, false);
            ctx.fillStyle = no.id === localizacao ? 'green' : (no.color || 'gray');
            ctx.fill();
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 0.5;
            ctx.stroke();

            ctx.font = `6px Arial`;
            ctx.fillStyle = 'white';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(rotulo, no.x, no.y);
          }}
        />
      </div>
    </div>
  );
}

export default App;