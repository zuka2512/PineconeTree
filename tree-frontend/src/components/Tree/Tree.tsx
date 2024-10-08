import React, { useEffect, useState } from 'react';
import { fetchTree, addNode, deleteNode, Node } from '../../services/nodeService';

const Tree: React.FC = () => {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [newNodeTitle, setnewNodeTitle] = useState<string>('');
  
  // Dohvaćanje stabla prilikom prvog renderiranja
  useEffect(() => {
    loadTree();
  }, []);

  const loadTree = async () => {
    const tree = await fetchTree();
    setNodes(tree);
  };

  // Funkcija za dodavanje novog čvora
  const handleAddNode = async () => {
    if (newNodeTitle.trim()) {
      const parentId = 0; // Root node ili drugi parent
      await addNode(parentId, newNodeTitle);
      setnewNodeTitle(''); // Resetiraj input
      loadTree(); // Ponovno učitaj stablo
    }
  };

  // Funkcija za brisanje čvora
  const handleDeleteNode = async (id: number) => {
    await deleteNode(id);
    loadTree(); // Ponovno učitaj stablo
  };

  return (
    <div>
      <h1>Tree Structure</h1>
      <ul>
        {nodes.map((node) => (
          <li key={node.id}>
            {node.title}
            <button onClick={() => handleDeleteNode(node.id)}>Delete</button>
          </li>
        ))}
      </ul>
      <div>
        <input
          value={newNodeTitle}
          onChange={(e) => setnewNodeTitle(e.target.value)}
          placeholder="New node title"
        />
        <button onClick={handleAddNode}>Add Node</button>
      </div>
    </div>
  );
};

export default Tree;
