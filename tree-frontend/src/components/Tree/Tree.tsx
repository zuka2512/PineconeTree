import React, { useEffect, useState } from 'react';
import { fetchTree, addNode, deleteNode, moveNode, updateNode, Node } from '../../services/nodeService';
import { Tree, TreeDataNode, TreeProps, Dropdown, message, Modal, Input } from 'antd';

const TreeComponent: React.FC = () => {
  const [gData, setGData] = useState<TreeDataNode[]>([]);
  const [newNodeTitle, setNewNodeTitle] = useState<string>('');
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [isRenameModalVisible, setRenameModalVisible] = useState(false);
  const [newTitle, setNewTitle] = useState<string>('');

  // Dohvaćanje stabla prilikom prvog renderiranja
  useEffect(() => {
    loadTree();
  });

  const loadTree = async () => {
    const tree = await fetchTree();
    const formattedData = formatTreeData(tree);
    setGData(formattedData);
  };

  const formatTreeData = (nodes: Node[]): TreeDataNode[] => {
    const map: { [key: number]: TreeDataNode } = {};
    const treeData: TreeDataNode[] = [];
    
    nodes.forEach(node => {
      map[node.id] = { title: renderTitle(node), key: node.id, children: [] };
    });

    nodes.forEach(node => {
      if (node.parentId === 0) {
        treeData.push(map[node.id]);
      } else {
        map[node.parentId].children?.push(map[node.id]);
      }
    });

    return treeData;
  };

  const handleAddNode = async () => {
    if (newNodeTitle.trim()) {
      const parentId = 0;
      await addNode(parentId, newNodeTitle);
      setNewNodeTitle('');
      loadTree();
    }
  };

  const handleDeleteNode = async (id: number) => {
    await deleteNode(id);
    loadTree();
    message.success('Node deleted successfully');
  };

  const handleRenameNode = async () => {
    if (selectedNode && newTitle.trim()) {
      await updateNode(selectedNode.id, newTitle);
      message.success('Node renamed successfully');
      setRenameModalVisible(false);
      setNewTitle('');
      loadTree();
    }
  };

  const onDrop: TreeProps['onDrop'] = (info) => {
    const dropKey = info.node.key;
    const dragKey = info.dragNode.key;
  
    moveNode(dragKey as number, dropKey as number)
      .then(() => {
        console.log(`Node ${dragKey} successfully moved to parent ${dropKey}`);
        loadTree();
      })
      .catch((error) => {
        console.error('Error moving node:', error);
      });
  };

  const onRightClick = ({ event, node }: any) => {
    setSelectedNode(node);
  };

  const renderTitle = (node: Node) => (
    <Dropdown
      menu={{
        items: [
          {
            key: 'delete',
            label: 'Delete',
            onClick: () => handleDeleteNode(node.id),
          },
          {
            key: 'rename',
            label: 'Rename',
            onClick: () => {
              setSelectedNode(node);
              setRenameModalVisible(true);
              setNewTitle(node.title);
            },
          },
        ],
      }}
      trigger={['contextMenu']}
    >
      <span>{node.title}</span>
    </Dropdown>
  );

  return (
    <div>
      <h1>Tree Structure</h1>
      <Tree
        className="draggable-tree"
        draggable
        blockNode
        onDrop={onDrop}
        onRightClick={onRightClick}
        treeData={gData}
      />
      <div>
        <input
          value={newNodeTitle}
          onChange={(e) => setNewNodeTitle(e.target.value)}
          placeholder="New node title"
        />
        <button onClick={handleAddNode}>Add Node</button>
      </div>

      <Modal
        title="Rename Node"
        visible={isRenameModalVisible}
        onOk={handleRenameNode}
        onCancel={() => setRenameModalVisible(false)}
      >
        <Input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Enter new title"
        />
      </Modal>
    </div>
  );
};

export default TreeComponent;
