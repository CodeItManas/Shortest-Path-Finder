import React, {Component} from 'react';
import Node from './Node/Node';
import {dijkstra} from '../algorithms/dijkstra';
import {AStar} from '../algorithms/aStar';
import {dfs} from '../algorithms/dfs';
import {bfs} from '../algorithms/bfs';

import './PathfindingVisualizer.css';

export default class PathfindingVisualizer extends Component {
  constructor() {
    super();
    this.state = {
      grid: [],
      START_NODE_ROW: 6,
      START_NODE_COL: 6,
      FINISH_NODE_ROW: 6,
      FINISH_NODE_COL: 26,
      mouseIsPressed: false,
      ROW_COUNT: 16,
      COLUMN_COUNT: 34,
      MOBILE_ROW_COUNT: 10,
      MOBILE_COLUMN_COUNT: 18,
      isRunning: false,
      isStartNode: false,
      isFinishNode: false,
      isWallNode: false,
      isEraseNode: false,
      currRow: 0,
      currCol: 0,
      isDesktopView: true,

      // Enhanced features & classic UI state
      activeAlgo: 'Dijkstra',
      activeTool: 'wall', // 'start', 'finish', 'wall', 'two-point', 'erase'
      twoPointStep: 1, // 1 for setting start, 2 for setting finish
      animSpeed: 15, // ms
      statusText: 'Ready to visualize. Select 2 points or draw walls!',
      pathLength: null,
      visitedCount: null,
    };

    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleMouseEnter = this.handleMouseEnter.bind(this);
    this.handleMouseUp = this.handleMouseUp.bind(this);
    this.handleMouseLeave = this.handleMouseLeave.bind(this);
    this.toggleIsRunning = this.toggleIsRunning.bind(this);
  }

  componentDidMount() {
    const grid = this.getInitialGrid();
    this.setState({grid});
  }

  toggleIsRunning() {
    this.setState({isRunning: !this.state.isRunning});
  }

  toggleView() {
    if (!this.state.isRunning) {
      const isDesktopView = !this.state.isDesktopView;
      let grid;
      if (isDesktopView) {
        grid = this.getInitialGrid(
          this.state.ROW_COUNT,
          this.state.COLUMN_COUNT,
          6, 6, 6, 26
        );
        this.setState({
          isDesktopView,
          grid,
          START_NODE_ROW: 6,
          START_NODE_COL: 6,
          FINISH_NODE_ROW: 6,
          FINISH_NODE_COL: 26,
          statusText: 'Switched to Desktop View grid.',
        });
      } else {
        grid = this.getInitialGrid(
          this.state.MOBILE_ROW_COUNT,
          this.state.MOBILE_COLUMN_COUNT,
          4, 3, 4, 14
        );
        this.setState({
          isDesktopView,
          grid,
          START_NODE_ROW: 4,
          START_NODE_COL: 3,
          FINISH_NODE_ROW: 4,
          FINISH_NODE_COL: 14,
          statusText: 'Switched to Mobile View grid.',
        });
      }
    }
  }

  getInitialGrid = (
    rowCount = this.state.isDesktopView ? this.state.ROW_COUNT : this.state.MOBILE_ROW_COUNT,
    colCount = this.state.isDesktopView ? this.state.COLUMN_COUNT : this.state.MOBILE_COLUMN_COUNT,
    startRow = this.state.START_NODE_ROW,
    startCol = this.state.START_NODE_COL,
    finishRow = this.state.FINISH_NODE_ROW,
    finishCol = this.state.FINISH_NODE_COL,
  ) => {
    const initialGrid = [];
    for (let row = 0; row < rowCount; row++) {
      const currentRow = [];
      for (let col = 0; col < colCount; col++) {
        currentRow.push(this.createNode(row, col, startRow, startCol, finishRow, finishCol));
      }
      initialGrid.push(currentRow);
    }
    return initialGrid;
  };

  createNode = (
    row,
    col,
    startRow = this.state.START_NODE_ROW,
    startCol = this.state.START_NODE_COL,
    finishRow = this.state.FINISH_NODE_ROW,
    finishCol = this.state.FINISH_NODE_COL,
  ) => {
    return {
      row,
      col,
      isStart: row === startRow && col === startCol,
      isFinish: row === finishRow && col === finishCol,
      distance: Infinity,
      distanceToFinishNode: Math.abs(finishRow - row) + Math.abs(finishCol - col),
      isVisited: false,
      isWall: false,
      previousNode: null,
      isNode: true,
    };
  };

  setStartPoint = (row, col) => {
    if (row === this.state.FINISH_NODE_ROW && col === this.state.FINISH_NODE_COL) return;

    const oldStartRow = this.state.START_NODE_ROW;
    const oldStartCol = this.state.START_NODE_COL;

    const prevElem = document.getElementById(`node-${oldStartRow}-${oldStartCol}`);
    if (prevElem) prevElem.className = 'node';

    const newElem = document.getElementById(`node-${row}-${col}`);
    if (newElem) newElem.className = 'node node-start';

    const newGrid = this.state.grid.map(r =>
      r.map(node => {
        if (node.row === row && node.col === col) {
          return {...node, isStart: true, isFinish: false, isWall: false};
        }
        if (node.row === oldStartRow && node.col === oldStartCol) {
          return {...node, isStart: false};
        }
        return node;
      })
    );

    this.setState({
      START_NODE_ROW: row,
      START_NODE_COL: col,
      grid: newGrid,
      statusText: `Start Point (Point 1) set to Row ${row}, Col ${col}`,
    });
  };

  setFinishPoint = (row, col) => {
    if (row === this.state.START_NODE_ROW && col === this.state.START_NODE_COL) return;

    const oldFinishRow = this.state.FINISH_NODE_ROW;
    const oldFinishCol = this.state.FINISH_NODE_COL;

    const prevElem = document.getElementById(`node-${oldFinishRow}-${oldFinishCol}`);
    if (prevElem) prevElem.className = 'node';

    const newElem = document.getElementById(`node-${row}-${col}`);
    if (newElem) newElem.className = 'node node-finish';

    const newGrid = this.state.grid.map(r =>
      r.map(node => {
        if (node.row === row && node.col === col) {
          return {...node, isFinish: true, isStart: false, isWall: false};
        }
        if (node.row === oldFinishRow && node.col === oldFinishCol) {
          return {...node, isFinish: false};
        }
        return node;
      })
    );

    this.setState({
      FINISH_NODE_ROW: row,
      FINISH_NODE_COL: col,
      grid: newGrid,
      statusText: `Target Point (Point 2) set to Row ${row}, Col ${col}`,
    });
  };

  handleMouseDown(row, col) {
    if (this.state.isRunning) return;

    if (!this.isGridClear()) {
      this.clearGrid();
    }

    const {START_NODE_ROW, START_NODE_COL, FINISH_NODE_ROW, FINISH_NODE_COL, activeTool, twoPointStep} = this.state;

    // Check if dragging existing Start Node
    if (row === START_NODE_ROW && col === START_NODE_COL) {
      this.setState({
        mouseIsPressed: true,
        isStartNode: true,
        currRow: row,
        currCol: col,
      });
      return;
    }

    // Check if dragging existing Finish Node
    if (row === FINISH_NODE_ROW && col === FINISH_NODE_COL) {
      this.setState({
        mouseIsPressed: true,
        isFinishNode: true,
        currRow: row,
        currCol: col,
      });
      return;
    }

    // Interactive placement tools
    if (activeTool === 'start') {
      this.setStartPoint(row, col);
    } else if (activeTool === 'finish') {
      this.setFinishPoint(row, col);
    } else if (activeTool === 'two-point') {
      if (twoPointStep === 1) {
        this.setStartPoint(row, col);
        this.setState({
          twoPointStep: 2,
          statusText: `Start Point set (${row}, ${col}). Now click to set Target Point!`,
        });
      } else {
        this.setFinishPoint(row, col);
        this.setState({
          twoPointStep: 1,
          activeTool: 'wall',
          statusText: `Target Point set (${row}, ${col}). Both points placed successfully!`,
        });
      }
    } else if (activeTool === 'wall') {
      const newGrid = getNewGridWithWallToggled(this.state.grid, row, col);
      this.setState({
        grid: newGrid,
        mouseIsPressed: true,
        isWallNode: true,
        currRow: row,
        currCol: col,
      });
    } else if (activeTool === 'erase') {
      const newGrid = getNewGridWithWallCleared(this.state.grid, row, col);
      this.setState({
        grid: newGrid,
        mouseIsPressed: true,
        isEraseNode: true,
        currRow: row,
        currCol: col,
      });
    }
  }

  handleMouseEnter(row, col) {
    if (this.state.isRunning || !this.state.mouseIsPressed) return;

    const {isStartNode, isFinishNode, isWallNode, isEraseNode, grid, currRow, currCol} = this.state;

    if (isStartNode) {
      if (row === this.state.FINISH_NODE_ROW && col === this.state.FINISH_NODE_COL) return;

      const prevStartNode = grid[currRow][currCol];
      prevStartNode.isStart = false;
      const prevElem = document.getElementById(`node-${currRow}-${currCol}`);
      if (prevElem) {
        prevElem.className = prevStartNode.isWall ? 'node node-wall' : 'node';
      }

      const currStartNode = grid[row][col];
      currStartNode.isStart = true;
      currStartNode.isWall = false;
      const currElem = document.getElementById(`node-${row}-${col}`);
      if (currElem) currElem.className = 'node node-start';

      this.setState({
        currRow: row,
        currCol: col,
        START_NODE_ROW: row,
        START_NODE_COL: col,
      });
    } else if (isFinishNode) {
      if (row === this.state.START_NODE_ROW && col === this.state.START_NODE_COL) return;

      const prevFinishNode = grid[currRow][currCol];
      prevFinishNode.isFinish = false;
      const prevElem = document.getElementById(`node-${currRow}-${currCol}`);
      if (prevElem) {
        prevElem.className = prevFinishNode.isWall ? 'node node-wall' : 'node';
      }

      const currFinishNode = grid[row][col];
      currFinishNode.isFinish = true;
      currFinishNode.isWall = false;
      const currElem = document.getElementById(`node-${row}-${col}`);
      if (currElem) currElem.className = 'node node-finish';

      this.setState({
        currRow: row,
        currCol: col,
        FINISH_NODE_ROW: row,
        FINISH_NODE_COL: col,
      });
    } else if (isWallNode) {
      const newGrid = getNewGridWithWallToggled(grid, row, col);
      this.setState({grid: newGrid});
    } else if (isEraseNode) {
      const newGrid = getNewGridWithWallCleared(grid, row, col);
      this.setState({grid: newGrid});
    }
  }

  handleMouseUp() {
    if (this.state.isRunning) return;
    this.setState({
      mouseIsPressed: false,
      isStartNode: false,
      isFinishNode: false,
      isWallNode: false,
      isEraseNode: false,
    });
  }

  handleMouseLeave() {
    if (this.state.isRunning) return;
    this.setState({
      mouseIsPressed: false,
      isStartNode: false,
      isFinishNode: false,
      isWallNode: false,
      isEraseNode: false,
    });
  }

  isGridClear() {
    for (const row of this.state.grid) {
      for (const node of row) {
        const elem = document.getElementById(`node-${node.row}-${node.col}`);
        if (elem && (elem.className.includes('node-visited') || elem.className.includes('node-shortest-path'))) {
          return false;
        }
      }
    }
    return true;
  }

  clearGrid() {
    if (this.state.isRunning) return;
    const newGrid = this.state.grid.slice();
    for (const row of newGrid) {
      for (const node of row) {
        let nodeElem = document.getElementById(`node-${node.row}-${node.col}`);
        if (!nodeElem) continue;

        node.isVisited = false;
        node.distance = Infinity;
        node.previousNode = null;
        node.distanceToFinishNode =
          Math.abs(this.state.FINISH_NODE_ROW - node.row) +
          Math.abs(this.state.FINISH_NODE_COL - node.col);

        if (node.isStart) {
          nodeElem.className = 'node node-start';
        } else if (node.isFinish) {
          nodeElem.className = 'node node-finish';
        } else if (node.isWall) {
          nodeElem.className = 'node node-wall';
        } else {
          nodeElem.className = 'node';
        }
      }
    }
    this.setState({
      grid: newGrid,
      pathLength: null,
      visitedCount: null,
      statusText: 'Path cleared. Ready to visualize.',
    });
  }

  clearWalls() {
    if (this.state.isRunning) return;
    const newGrid = this.state.grid.slice();
    for (const row of newGrid) {
      for (const node of row) {
        if (node.isWall) {
          node.isWall = false;
          let nodeElem = document.getElementById(`node-${node.row}-${node.col}`);
          if (nodeElem && !node.isStart && !node.isFinish) {
            nodeElem.className = 'node';
          }
        }
      }
    }
    this.setState({
      grid: newGrid,
      statusText: 'Walls cleared.',
    });
  }

  resetBoard() {
    if (this.state.isRunning) return;
    this.clearGrid();
    this.clearWalls();
    this.setState({
      activeTool: 'wall',
      twoPointStep: 1,
      statusText: 'Board reset to default state.',
    });
  }

  generateRandomMaze = () => {
    if (this.state.isRunning) return;
    this.clearGrid();
    const {grid, START_NODE_ROW, START_NODE_COL, FINISH_NODE_ROW, FINISH_NODE_COL} = this.state;
    const newGrid = grid.map(row =>
      row.map(node => {
        const isStart = node.row === START_NODE_ROW && node.col === START_NODE_COL;
        const isFinish = node.row === FINISH_NODE_ROW && node.col === FINISH_NODE_COL;
        if (isStart || isFinish) {
          return {...node, isWall: false};
        }
        const isWall = Math.random() < 0.28;
        let elem = document.getElementById(`node-${node.row}-${node.col}`);
        if (elem) {
          elem.className = isWall ? 'node node-wall' : 'node';
        }
        return {...node, isWall};
      })
    );
    this.setState({
      grid: newGrid,
      statusText: 'Random wall maze generated!',
    });
  };

  visualize(algo = this.state.activeAlgo) {
    if (this.state.isRunning) return;
    this.clearGrid();
    this.toggleIsRunning();
    this.setState({
      statusText: `Visualizing ${algo}...`,
      activeAlgo: algo,
    });

    const {grid} = this.state;
    const startNode = grid[this.state.START_NODE_ROW][this.state.START_NODE_COL];
    const finishNode = grid[this.state.FINISH_NODE_ROW][this.state.FINISH_NODE_COL];

    for (const row of grid) {
      for (const node of row) {
        node.distance = Infinity;
        node.isVisited = false;
        node.previousNode = null;
        node.distanceToFinishNode =
          Math.abs(this.state.FINISH_NODE_ROW - node.row) +
          Math.abs(this.state.FINISH_NODE_COL - node.col);
      }
    }

    let visitedNodesInOrder = [];
    switch (algo) {
      case 'Dijkstra':
        visitedNodesInOrder = dijkstra(grid, startNode, finishNode);
        break;
      case 'AStar':
        visitedNodesInOrder = AStar(grid, startNode, finishNode);
        break;
      case 'BFS':
        visitedNodesInOrder = bfs(grid, startNode, finishNode);
        break;
      case 'DFS':
        visitedNodesInOrder = dfs(grid, startNode, finishNode);
        break;
      default:
        break;
    }

    if (!visitedNodesInOrder) visitedNodesInOrder = [];

    const nodesInShortestPathOrder = getNodesInShortestPathOrder(finishNode);
    nodesInShortestPathOrder.push('end');

    this.animate(visitedNodesInOrder, nodesInShortestPathOrder);
  }

  animate(visitedNodesInOrder, nodesInShortestPathOrder) {
    const speed = this.state.animSpeed;
    const totalVisited = visitedNodesInOrder.length;

    for (let i = 0; i <= totalVisited; i++) {
      if (i === totalVisited) {
        setTimeout(() => {
          this.animateShortestPath(nodesInShortestPathOrder, totalVisited);
        }, speed * i);
        return;
      }
      setTimeout(() => {
        const node = visitedNodesInOrder[i];
        const elem = document.getElementById(`node-${node.row}-${node.col}`);
        if (elem && !elem.className.includes('node-start') && !elem.className.includes('node-finish')) {
          elem.className = 'node node-visited';
        }
      }, speed * i);
    }
  }

  animateShortestPath(nodesInShortestPathOrder, totalVisited) {
    const speed = Math.max(15, this.state.animSpeed * 1.5);
    const pathNodes = nodesInShortestPathOrder.filter(n => n !== 'end');
    const reachedTarget = pathNodes.length > 1 && pathNodes[pathNodes.length - 1].isFinish;
    const pathLen = reachedTarget ? pathNodes.length - 1 : 0;

    for (let i = 0; i < nodesInShortestPathOrder.length; i++) {
      if (nodesInShortestPathOrder[i] === 'end') {
        setTimeout(() => {
          this.toggleIsRunning();
          if (reachedTarget) {
            this.setState({
              statusText: `✨ Shortest Path Found! (${pathLen} steps, ${totalVisited} nodes visited)`,
              pathLength: pathLen,
              visitedCount: totalVisited,
            });
          } else {
            this.setState({
              statusText: `❌ No Path Possible to Target! (${totalVisited} nodes visited)`,
              pathLength: 0,
              visitedCount: totalVisited,
            });
          }
        }, i * speed);
      } else {
        setTimeout(() => {
          const node = nodesInShortestPathOrder[i];
          const elem = document.getElementById(`node-${node.row}-${node.col}`);
          if (elem && !elem.className.includes('node-start') && !elem.className.includes('node-finish')) {
            elem.className = 'node node-shortest-path';
          }
        }, i * speed);
      }
    }
  }

  render() {
    const {
      grid,
      mouseIsPressed,
      activeAlgo,
      activeTool,
      START_NODE_ROW,
      START_NODE_COL,
      FINISH_NODE_ROW,
      FINISH_NODE_COL,
      statusText,
      pathLength,
      visitedCount,
      animSpeed,
      isDesktopView,
      isRunning,
    } = this.state;

    const manhattanDist =
      Math.abs(FINISH_NODE_ROW - START_NODE_ROW) +
      Math.abs(FINISH_NODE_COL - START_NODE_COL);

    return (
      <div className="visualizer-wrapper">
        {/* Classic Header */}
        <header className="visualizer-header">
          <div className="brand-title">
            <span className="brand-icon" role="img" aria-label="Map">🗺️</span>
            <h1>OPTIMAL PATHFINDER</h1>
            <span className="brand-badge">CLASSIC EDITION</span>
          </div>

          {/* Algorithm Selector Pills */}
          <div className="algo-selector">
            {['Dijkstra', 'AStar', 'BFS', 'DFS'].map(algo => (
              <button
                key={algo}
                disabled={isRunning}
                className={`algo-btn ${activeAlgo === algo ? 'active' : ''}`}
                onClick={() => this.setState({activeAlgo: algo})}>
                {algo === 'AStar' ? 'A* Search' : algo === 'BFS' ? 'BFS (Breadth First)' : algo === 'DFS' ? 'DFS (Depth First)' : 'Dijkstra'}
              </button>
            ))}
          </div>
        </header>

        {/* Main Toolbar & Point Controls */}
        <div className="toolbar">
          {/* Mode Selector */}
          <div className="tool-group">
            <span className="tool-group-label">Selection Tool:</span>
            <button
              disabled={isRunning}
              className={`tool-btn ${activeTool === 'two-point' ? 'active-two-point' : ''}`}
              onClick={() => this.setState({activeTool: 'two-point', twoPointStep: 1, statusText: 'Click anywhere on the grid to set Point 1 (Start)'})}>
              <span role="img" aria-label="Pin">📍</span> Pick Any 2 Points
            </button>
            <button
              disabled={isRunning}
              className={`tool-btn ${activeTool === 'start' ? 'active-start' : ''}`}
              onClick={() => this.setState({activeTool: 'start', statusText: 'Click any cell to move Start Point (Point 1)'})}>
              <span role="img" aria-label="Start Flag">🚩</span> Set Start
            </button>
            <button
              disabled={isRunning}
              className={`tool-btn ${activeTool === 'finish' ? 'active-finish' : ''}`}
              onClick={() => this.setState({activeTool: 'finish', statusText: 'Click any cell to move Target Point (Point 2)'})}>
              <span role="img" aria-label="Target">🎯</span> Set Target
            </button>
            <button
              disabled={isRunning}
              className={`tool-btn ${activeTool === 'wall' ? 'active-wall' : ''}`}
              onClick={() => this.setState({activeTool: 'wall', statusText: 'Click or drag to draw obstacles/walls'})}>
              <span role="img" aria-label="Wall">🧱</span> Draw Walls
            </button>
            <button
              disabled={isRunning}
              className={`tool-btn ${activeTool === 'erase' ? 'active-erase' : ''}`}
              onClick={() => this.setState({activeTool: 'erase', statusText: 'Click or drag to erase walls'})}>
              <span role="img" aria-label="Erase">🧹</span> Erase
            </button>
          </div>

          {/* Primary Action Controls */}
          <div className="action-group">
            <button
              disabled={isRunning}
              className="action-btn run-btn"
              onClick={() => this.visualize()}>
              ▶ Visualize {activeAlgo}
            </button>
            <button
              disabled={isRunning}
              className="action-btn secondary-btn"
              onClick={() => this.generateRandomMaze()}>
              <span role="img" aria-label="Dice">🎲</span> Random Maze
            </button>
            <button
              disabled={isRunning}
              className="action-btn secondary-btn"
              onClick={() => this.clearGrid()}>
              <span role="img" aria-label="Sparkles">✨</span> Clear Path
            </button>
            <button
              disabled={isRunning}
              className="action-btn secondary-btn"
              onClick={() => this.clearWalls()}>
              <span role="img" aria-label="Wall">🧱</span> Clear Walls
            </button>
            <button
              disabled={isRunning}
              className="action-btn secondary-btn"
              onClick={() => this.resetBoard()}>
              <span role="img" aria-label="Reset">🔄</span> Reset Board
            </button>
          </div>
        </div>

        {/* Status & Point Coordinates Info Bar */}
        <div className="info-bar">
          <div className="info-status">
            <span className="status-indicator"></span>
            <span className="status-text">{statusText}</span>
          </div>

          <div className="coordinates-chips">
            <div className="chip point-start-chip">
              <span className="chip-label">Point 1 (Start):</span>
              <span className="chip-value">({START_NODE_ROW}, {START_NODE_COL})</span>
            </div>
            <div className="chip point-finish-chip">
              <span className="chip-label">Point 2 (Target):</span>
              <span className="chip-value">({FINISH_NODE_ROW}, {FINISH_NODE_COL})</span>
            </div>
            <div className="chip distance-chip">
              <span className="chip-label">Direct Distance:</span>
              <span className="chip-value">{manhattanDist} units</span>
            </div>
            {pathLength !== null && (
              <div className="chip path-chip">
                <span className="chip-label">Shortest Path:</span>
                <span className="chip-value">{pathLength} steps</span>
              </div>
            )}
            {visitedCount !== null && (
              <div className="chip visited-chip">
                <span className="chip-label">Visited:</span>
                <span className="chip-value">{visitedCount} nodes</span>
              </div>
            )}
          </div>
        </div>

        {/* Speed & View Options */}
        <div className="options-bar">
          <div className="speed-control">
            <span>Speed:</span>
            <button
              className={`speed-btn ${animSpeed === 45 ? 'active' : ''}`}
              onClick={() => this.setState({animSpeed: 45})}>Slow</button>
            <button
              className={`speed-btn ${animSpeed === 15 ? 'active' : ''}`}
              onClick={() => this.setState({animSpeed: 15})}>Normal</button>
            <button
              className={`speed-btn ${animSpeed === 5 ? 'active' : ''}`}
              onClick={() => this.setState({animSpeed: 5})}>Fast</button>
          </div>

          <button
            disabled={isRunning}
            className="view-toggle-btn"
            onClick={() => this.toggleView()}>
            {isDesktopView ? '📱 Switch to Mobile Grid' : '💻 Switch to Desktop Grid'}
          </button>
        </div>

        {/* Visualizer Grid Table */}
        <div className="grid-card">
          <table
            className="grid-container"
            onMouseLeave={() => this.handleMouseLeave()}>
            <tbody className="grid">
              {grid.map((row, rowIdx) => (
                <tr key={rowIdx}>
                  {row.map((node, nodeIdx) => {
                    const {row, col, isFinish, isStart, isWall} = node;
                    return (
                      <Node
                        key={nodeIdx}
                        col={col}
                        isFinish={isFinish}
                        isStart={isStart}
                        isWall={isWall}
                        mouseIsPressed={mouseIsPressed}
                        onMouseDown={(r, c) => this.handleMouseDown(r, c)}
                        onMouseEnter={(r, c) => this.handleMouseEnter(r, c)}
                        onMouseUp={() => this.handleMouseUp()}
                        row={row}
                      />
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Visual Legend */}
        <div className="legend-container">
          <div className="legend-item">
            <span className="legend-box node-start">
              <svg className="node-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
            </span>
            <span>Point 1 (Start Node)</span>
          </div>

          <div className="legend-item">
            <span className="legend-box node-finish">
              <svg className="node-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm-2-13.5l6 4.5-6 4.5v-9z"/>
              </svg>
            </span>
            <span>Point 2 (Target Node)</span>
          </div>

          <div className="legend-item">
            <span className="legend-box node-wall"></span>
            <span>Obstacle / Wall</span>
          </div>

          <div className="legend-item">
            <span className="legend-box node-visited-sample"></span>
            <span>Visited Node</span>
          </div>

          <div className="legend-item">
            <span className="legend-box node-shortest-path-sample"></span>
            <span>Shortest Path</span>
          </div>
        </div>
      </div>
    );
  }
}

const getNewGridWithWallToggled = (grid, row, col) => {
  const newGrid = grid.slice();
  const node = newGrid[row][col];
  if (!node.isStart && !node.isFinish && node.isNode) {
    const newNode = {
      ...node,
      isWall: !node.isWall,
    };
    newGrid[row][col] = newNode;
  }
  return newGrid;
};

const getNewGridWithWallCleared = (grid, row, col) => {
  const newGrid = grid.slice();
  const node = newGrid[row][col];
  if (node.isWall) {
    const newNode = {
      ...node,
      isWall: false,
    };
    newGrid[row][col] = newNode;
  }
  return newGrid;
};

function getNodesInShortestPathOrder(finishNode) {
  const nodesInShortestPathOrder = [];
  let currentNode = finishNode;
  while (currentNode !== null) {
    nodesInShortestPathOrder.unshift(currentNode);
    currentNode = currentNode.previousNode;
  }
  return nodesInShortestPathOrder;
}
