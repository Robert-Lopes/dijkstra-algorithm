import React, { useState, useRef } from 'react';
import ForceGraph2D from 'react-force-graph-2d';

/* Definição do Componente e Estados
   Define o componente principal App e inicializa os estados com useState para gerenciar os dados do grafo,
   mensagens de erro, localização do usuário, caminhos encontrados, caminho selecionado, estado de carregamento
   e arquivo carregado. Também cria uma referência com useRef para interagir com o componente ForceGraph2D.
*/
function App() {
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [error, setError] = useState(null);
  const [location, setLocation] = useState('');
  const [paths, setPaths] = useState([]);
  const [selectedPath, setSelectedPath] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [file, setFile] = useState(null);
  const fgRef = useRef();

  /*Função handleFileUpload
   Processa o upload de um arquivo .txt, validando seu tipo e conteúdo. Lê o arquivo, parseia as linhas
   no formato "origem: destino1peso1, destino2peso2" para criar nós e arestas do grafo. Atualiza o estado
   graphData com os nós e arestas extraídos ou define mensagens de erro se o formato for inválido.
*/
  const handleFileUpload = (event) => {
    setGraphData({ nodes: [], links: [] });
    setFile(null);
    setPaths([]);
    setSelectedPath(null);
    setLocation('');
    setError(null);

    const selectedFile = event.target.files[0];
    setFile(selectedFile);

    if (!selectedFile) {
      setError('Nenhum arquivo selecionado.');
      return;
    }

    if (selectedFile.type !== 'text/plain') {
      setError('Por favor, envie um arquivo .txt');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result.trim();
      if (!text) {
        setError('O arquivo está vazio.');
        return;
      }

      try {
        const lines = text.split('\n');
        const nodesSet = new Set();
        const links = [];
        const linkPairs = new Set();

        lines.forEach(line => {
          const [from, rest] = line.split(':').map(s => s.trim());

          if (!from || !rest) {
            throw new Error(`Formato inválido na linha: ${line}`);
          }

          rest.split(',').forEach(part => {
            const match = part.trim().match(/^([A-Za-z]+)(\d+)$/);
            if (!match) {
              throw new Error(`Destino/peso inválido na linha: ${line}`);
            }

            const [, to, weight] = match;
            nodesSet.add(from);
            nodesSet.add(to);

            const pairKey = [from, to].sort().join('-');
            const isReverse = linkPairs.has(pairKey);
            linkPairs.add(pairKey);

            links.push({
              source: from,
              target: to,
              label: weight,
              value: parseInt(weight),
              curvature: isReverse ? 0.3 : 0
            });
          });
        });

        const nodes = Array.from(nodesSet).map(id => ({ id }));
        setGraphData({ nodes, links });
      } catch (err) {
        setError(err.message);
        setGraphData({ nodes: [], links: [] });
      }
    };

    reader.readAsText(selectedFile);
  };

  /*Função handleSearchRoutes
   Valida a localização informada pelo usuário (deve ser uma letra única e um nó válido no grafo).
   Envia uma requisição POST ao backend com o arquivo e o nó inicial para buscar caminhos.
   Atualiza o estado paths com os caminhos retornados ou exibe erros se a requisição falhar.
*/
  const handleSearchRoutes = async () => {
    setError(null);
    setIsLoading(true);

    if (!location) {
      setError('Por favor, informe uma localização.');
      setIsLoading(false);
      return;
    }

    if (!location.match(/^[A-Za-z]$/)) {
      setError('A localização deve ser uma única letra (ex.: A).');
      setIsLoading(false);
      return;
    }

    if (!graphData.nodes.some(node => node.id === location)) {
      setError('Localização inválida. Escolha um nó existente.');
      setIsLoading(false);
      return;
    }

    const hasOutgoingEdges = graphData.links.some(link => link.source.id === location);
    if (!hasOutgoingEdges) {
      setError(`O nó ${location} é um sumidouro. Não é possível calcular caminhos a partir dele.`);
      setPaths([]);
      setSelectedPath(null);
      setIsLoading(false);
      return;
    }

    if (!file) {
      setError('Nenhum arquivo selecionado.');
      setIsLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('arquivoGrafo', file);
      
      console.log('Enviando FormData:', {
        verticeInicial: location,
        arquivoGrafo: file.name
      });

      const response = await fetch(`http://127.0.0.1:5000/custo?verticeInicial=${encodeURIComponent(location)}`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Erro do servidor:', errorData);
        throw new Error(`Erro ${response.status}: ${errorData.detail}`);
      }

      const data = await response.json();
      console.log('Resposta recebida:', data);
      setPaths(data.paths);
      setError(null);
    } catch (err) {
      console.error('Erro na requisição:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  /*Função handlePathClick
   Define o caminho selecionado pelo usuário quando um caminho da lista é clicado,
   permitindo que ele seja destacado visualmente no grafo.
*/
  const handlePathClick = (path) => {
    setSelectedPath(path);
  };

  /*Renderização do JSX
   Define a interface do usuário, dividida em duas seções: um painel lateral com controles
   (upload de arquivo, entrada de localização, botão de busca e lista de caminhos) e uma área
   fixa para o grafo. Inclui estilos inline para layout e comportamento visual.
*/
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
          <input type="file" accept=".txt" onChange={handleFileUpload} />
          {error && <p style={{ color: 'red', marginTop: 10 }}>{error}</p>}
        </div>
        <div style={{ marginBottom: 20 }}>
          <p style={{ marginBottom: 10 }}>Informe a origem:</p>
          <input
            type="text"
            placeholder="Digite sua localização"
            value={location}
            onChange={(e) => setLocation(e.target.value.trim().toUpperCase())}
            style={{ width: '95%', padding: 8, border: '1px solid #ccc', borderRadius: 4 }}
          />
          <button
            onClick={handleSearchRoutes}
            disabled={isLoading}
            style={{
              width: '100%',
              padding: 8,
              marginTop: 10,
              backgroundColor: isLoading ? '#ccc' : '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: 4,
              cursor: isLoading ? 'not-allowed' : 'pointer'
            }}
          >
            {isLoading ? 'Buscando...' : 'Buscar Rotas'}
          </button>
        </div>
        {paths.length > 0 && (
          <div>
            <h3 style={{ marginBottom: 10 }}>Caminhos Encontrados (Origem: {location})</h3>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {paths.map((path, index) => (
                <li
                  key={index}
                  onClick={() => handlePathClick(path)}
                  style={{
                    padding: 10,
                    marginBottom: 5,
                    backgroundColor: selectedPath === path ? '#e0f7fa' : '#f5f5f5',
                    borderRadius: 4,
                    cursor: 'pointer',
                    border: '1px solid #ddd'
                  }}
                >
                  <strong>Destino: {path.target}</strong><br />
                  Caminho: {path.path.join(' -> ')}<br />
                  Custo: {path.cost}
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

    {/* Configuração do ForceGraph2D
   Configura o componente ForceGraph2D para renderizar o grafo. Define propriedades visuais para nós
   (círculos com rótulos, destacando o nó inicial em verde) e arestas (setas com pesos, destacando o
   caminho selecionado em vermelho). Inclui lógica para renderizar rótulos de pesos nas arestas, com
   suporte a curvatura para arestas bidirecionais. */}

        <ForceGraph2D
          ref={fgRef}
          graphData={graphData}
          nodeAutoColorBy="id"
          linkDirectionalArrowLength={6}
          linkDirectionalArrowRelPos={1}
          linkLabel={link => `peso: ${link.label}`}
          linkCurvature={link => link.curvature || 0}
          linkLineWidth={link => {
            if (!selectedPath) return 1;
            for (let i = 0; i < selectedPath.path.length - 1; i++) {
              const source = selectedPath.path[i];
              const target = selectedPath.path[i + 1];
              if (link.source.id === source && link.target.id === target) {
                return 3;
              }
            }
            return 1;
          }}
          linkColor={link => {
            if (!selectedPath) return 'gray';
            for (let i = 0; i < selectedPath.path.length - 1; i++) {
              const source = selectedPath.path[i];
              const target = selectedPath.path[i + 1];
              if (link.source.id === source && link.target.id === target) {
                return 'red';
              }
            }
            return 'gray';
          }}
          linkCanvasObjectMode={() => 'after'}
          linkCanvasObject={(link, ctx) => {
            const label = `${link.label}`;
            if (!label) return;

            const curvature = link.curvature || 0;
            const startX = link.source.x;
            const startY = link.source.y;
            const endX = link.target.x;
            const endY = link.target.y;

            if (curvature === 0) {
              const midX = (startX + endX) / 2;
              const midY = (startY + endY) / 2;

              ctx.font = '4px Arial';
              ctx.fillStyle = 'white';
              ctx.lineWidth = 0;
              ctx.strokeText(label, midX, midY);
              ctx.fillText(label, midX, midY);
            } else {
              const dx = endX - startX;
              const dy = endY - startY;
              const dist = Math.sqrt(dx * dx + dy * dy);
              const midX = (startX + endX) / 2;
              const midY = (startY + endY) / 2;

              const nx = -dy / dist;
              const ny = dx / dist;
              const curveOffset = curvature * dist * (-0.5);

              const labelX = midX + nx * curveOffset;
              const labelY = midY + ny * curveOffset;

              ctx.font = '4px Arial';
              ctx.fillStyle = 'white';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.strokeText(label, labelX, labelY);
              ctx.fillText(label, labelX, labelY);
            }
          }}
          nodeCanvasObject={(node, ctx, globalScale) => {
            const label = node.id;
            const radius = 5;

            ctx.beginPath();
            ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);
            ctx.fillStyle = node.id === location ? 'green' : (node.color || 'gray');
            ctx.fill();
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 0.5;
            ctx.stroke();

            ctx.font = `6px Arial`;
            ctx.fillStyle = 'white';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(label, node.x, node.y);
          }}
        />
      </div>
    </div>
  );
}

export default App;