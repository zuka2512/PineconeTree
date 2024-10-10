import React, { useEffect, useState } from "react";
import {
  fetchTree,
  addNode,
  deleteNode,
  moveNode,
  updateNode,
} from "../../services/nodeService";
import type { Node } from "../../services/nodeService";
import { Tree, TreeDataNode, Menu, Dropdown } from "antd";
import { TreeProps } from "antd/lib/tree";
import "./Tree.css";

const TreeComponent: React.FC = () => {
  const [gData, setGData] = useState<TreeDataNode[]>([]);
  const [selectedNodeKey, setSelectedNodeKey] = useState<number | null>(null);
  const [contextMenuVisible, setContextMenuVisible] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({
    x: 0,
    y: 0,
  });

  useEffect(() => {
    loadTree();
  });

  const loadTree = async () => {
    const tree = await fetchTree();
    const formattedData = formatTreeData(tree);
    setGData(formattedData);
  };

  const formatTreeData = (nodes: Node[]): TreeDataNode[] => {
    const map: { [key: number]: TreeDataNode & { parentId: number } } = {};
    const treeData: TreeDataNode[] = [];

    nodes.forEach((node) => {
      map[node.id] = {
        title: node.title,
        key: node.id,
        children: [],
        parentId: node.parentId,
      };
    });

    nodes.forEach((node) => {
      if (node.parentId === 0) {
        treeData.push(map[node.id]);
      } else {
        map[node.parentId].children?.push(map[node.id]);
      }
    });

    return treeData;
  };

  const handleAddNode = async () => {
    if (selectedNodeKey === null) return;

    const newTitle = prompt("Enter new node title");
    if (newTitle) {
      await addNode(selectedNodeKey, newTitle);
      loadTree();
    }
  };

  const handleDeleteNode = async (id: number) => {
    const nodeToDelete = gData.find(
      (node) => node.key === id
    ) as TreeDataNode & { parentId: number };
    if (nodeToDelete && nodeToDelete.parentId === 0) {
      alert("Root node cannot be deleted.");
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to delete this node?"
    );
    if (confirmed) {
      await deleteNode(id);
      loadTree();
    }
  };

  const handleRenameNode = async (id: number) => {
    const newTitle = prompt("Enter new node title");
    if (newTitle) {
      await updateNode(id, newTitle);
      loadTree();
    }
  };

  const onDrop: TreeProps["onDrop"] = (info) => {
    const dropKey = info.node.key as number;
    const dragKey = info.dragNode.key as number;

    if (dropKey === 0) {
      alert("Root node cannot have child nodes.");
      return;
    }

    moveNode(dragKey, dropKey)
      .then(() => {
        loadTree();
      })
      .catch((error) => {
        console.error("Error moving node:", error);
      });
  };

  const onRightClick = ({ event, node }: any) => {
    event.preventDefault();
    setSelectedNodeKey(node.key);
    setContextMenuPosition({ x: event.clientX, y: event.clientY });
    setContextMenuVisible(true);
  };

  const contextMenu = (
    <Menu>
      <Menu.Item key="1" onClick={handleAddNode}>
        Add Child Node
      </Menu.Item>
      <Menu.Item
        key="2"
        onClick={() => handleDeleteNode(selectedNodeKey as number)}
      >
        Delete Node
      </Menu.Item>
      <Menu.Item
        key="3"
        onClick={() => handleRenameNode(selectedNodeKey as number)}
      >
        Rename Node
      </Menu.Item>
    </Menu>
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      if (contextMenuVisible && !target.closest(".ant-dropdown")) {
        setContextMenuVisible(false);
      }
    };

    document.addEventListener("click", handleClickOutside);

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [contextMenuVisible]);

  return (
    <div>
      <h1>Tree Structure</h1>
      <div className="tree-container">
        <Tree
          className="draggable-tree"
          draggable
          blockNode
          onDrop={onDrop}
          treeData={gData}
          onRightClick={onRightClick}
        />
        {contextMenuVisible && (
          <Dropdown
            overlay={contextMenu}
            trigger={["click"]}
            visible={contextMenuVisible}
            placement="bottomLeft"
          >
            <div
              style={{
                position: "absolute",
                top: contextMenuPosition.y,
                left: contextMenuPosition.x,
                zIndex: 1000,
              }}
            />
          </Dropdown>
        )}
      </div>
    </div>
  );
};

export default TreeComponent;
