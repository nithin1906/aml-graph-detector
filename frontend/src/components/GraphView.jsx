import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CytoscapeComponent from 'react-cytoscapejs';
import cytoscape from 'cytoscape';
import { ZoomIn, ZoomOut } from 'lucide-react';


const GraphView = ({ graphData, onNodeClick }) => {
    const [cy, setCy] = useState(null);
    const [selectedNode, setSelectedNode] = useState(null);

    useEffect(() => {
        if (cy) {
            const layout = cy.layout({
                name: 'cose',
                animate: true,
                animationDuration: 1500,
                animationEasing: 'ease-out-cubic',
                fit: true,
                padding: 60,
                componentSpacing: 150,
                nodeRepulsion: 600000,
                edgeElasticity: 120,
                nestingFactor: 5,
                gravity: 100,
                numIter: 1200,
                initialTemp: 250,
                coolingFactor: 0.92,
                minTemp: 0.5
            });
            layout.run();
        }
    }, [cy, graphData]);

    useEffect(() => {
        if (cy) {
            cy.on('tap', 'node', (event) => {
                const node = event.target;
                const data = node.data();
                setSelectedNode(data);
                onNodeClick(data);

                node.neighborhood('edge').style({
                    'line-color': '#8b5cf6',
                    'target-arrow-color': '#8b5cf6',
                    'width': 4,
                    'opacity': 1
                });
            });

            cy.on('tap', (event) => {
                if (event.target === cy) {
                    setSelectedNode(null);
                    cy.elements().style({
                        'line-color': '#475569',
                        'target-arrow-color': '#475569',
                        'width': 2,
                        'opacity': 0.6
                    });
                }
            });

            cy.on('mouseover', 'node', (event) => {
                const node = event.target;
                node.style({
                    'width': 55,
                    'height': 55,
                    'border-width': 4,
                    'z-index': 999
                });
                node.neighborhood('edge').style({
                    'line-color': '#60a5fa',
                    'target-arrow-color': '#60a5fa',
                    'width': 3,
                    'opacity': 0.8
                });
            });

            cy.on('mouseout', 'node', (event) => {
                const node = event.target;
                const isSuspicious = node.data('suspicious') === 'true';
                node.style({
                    'width': isSuspicious ? 50 : 45,
                    'height': isSuspicious ? 50 : 45,
                    'border-width': isSuspicious ? 4 : 3,
                    'z-index': 1
                });
                if (selectedNode?.id !== node.data('id')) {
                    node.neighborhood('edge').style({
                        'line-color': '#475569',
                        'target-arrow-color': '#475569',
                        'width': 2,
                        'opacity': 0.6
                    });
                }
            });

            return () => {
                cy.removeAllListeners();
            };
        }
    }, [cy, onNodeClick, selectedNode]);

    const style = [
        {
            selector: 'node',
            style: {
                'background-color': '#3b82f6',
                'label': 'data(label)',
                'color': '#ffffff',
                'text-valign': 'center',
                'text-halign': 'center',
                'width': 45,
                'height': 45,
                'font-size': 12,
                'font-weight': 700,
                'text-outline-width': 3,
                'text-outline-color': '#0f172a',
                'text-outline-opacity': 0.8,
                'border-width': 3,
                'border-color': '#60a5fa',
                'border-opacity': 0.9,
                'shape': 'round-rectangle',
                'transition-property': 'width, height, border-width, border-color',
                'transition-duration': '0.3s',
                'transition-timing-function': 'cubic-bezier(0.4, 0, 0.2, 1)',
                'overlay-opacity': 0,
                'overlay-padding': '8px'
            }
        },
        {
            selector: 'node[type="user"]',
            style: {
                'background-color': '#3b82f6',
                'border-color': '#60a5fa'
            }
        },
        {
            selector: 'node[suspicious="true"]',
            style: {
                'background-color': '#ef4444',
                'border-width': 5,
                'border-color': '#fca5a5',
                'border-opacity': 1,
                'width': 50,
                'height': 50,
                'font-size': 13,
                'font-weight': 800,
                'text-outline-color': '#7f1d1d',
                'z-index': 10
            }
        },
        {
            selector: 'node:selected',
            style: {
                'border-width': 5,
                'border-color': '#8b5cf6',
                'width': 60,
                'height': 60,
                'z-index': 1000
            }
        },
        {
            selector: 'edge',
            style: {
                'width': 2.5,
                'line-color': '#64748b',
                'target-arrow-color': '#64748b',
                'target-arrow-shape': 'triangle',
                'arrow-scale': 1.2,
                'curve-style': 'bezier',
                'opacity': 0.7,
                'transition-property': 'line-color, width, opacity, target-arrow-color',
                'transition-duration': '0.4s',
                'transition-timing-function': 'cubic-bezier(0.4, 0, 0.2, 1)',
                'line-cap': 'round'
            }
        },
        {
            selector: 'edge[is_laundering="true"]',
            style: {
                'line-color': '#f87171',
                'target-arrow-color': '#f87171',
                'width': 4,
                'opacity': 1,
                'line-style': 'solid',
                'line-cap': 'round',
                'arrow-scale': 1.5
            }
        },
        {
            selector: 'edge:selected',
            style: {
                'line-color': '#8b5cf6',
                'target-arrow-color': '#8b5cf6',
                'width': 5,
                'opacity': 1,
                'z-index': 999
            }
        },
        {
            selector: 'edge:active',
            style: {
                'line-color': '#a78bfa',
                'target-arrow-color': '#a78bfa',
                'width': 4.5,
                'opacity': 0.95
            }
        }
    ];

    return (
        <motion.div
            className="w-full h-full rounded-xl overflow-hidden relative bg-gradient-to-br from-slate-900/60 via-slate-800/50 to-slate-900/60"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            style={{ minHeight: '500px' }}
        >
            {graphData && (
                <>
                    <CytoscapeComponent
                        elements={CytoscapeComponent.normalizeElements(graphData?.elements || { nodes: [], edges: [] })}
                        style={{ width: '100%', height: '100%' }}
                        stylesheet={style}
                        cy={(cyInstance) => setCy(cyInstance)}
                        minZoom={0.1}
                        maxZoom={3}
                        userZoomingEnabled={false}
                    />
                    <AnimatePresence>
                        {selectedNode && (
                            <motion.div
                                className="absolute top-4 left-4 glass-panel p-4 max-w-xs z-50"
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <div className={`p-2 rounded-lg ${selectedNode.suspicious === 'true' ? 'bg-red-500/20' : 'bg-blue-500/20'}`}>
                                        <div className={`w-3 h-3 rounded-full ${selectedNode.suspicious === 'true' ? 'bg-red-400' : 'bg-blue-400'}`} />
                                    </div>
                                    <h4 className="font-bold text-gray-200">Node {selectedNode.id}</h4>
                                </div>
                                {selectedNode.suspicious === 'true' && (
                                    <p className="text-xs text-red-400 font-semibold">⚠️ Suspicious Activity Detected</p>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </>
            )}

            {/* Zoom Controls */}
            <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-40">
                <motion.button
                    className="p-2 bg-slate-800/80 hover:bg-slate-700 text-white rounded-lg border border-slate-600 shadow-lg backdrop-blur-sm"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                        if (cy) {
                            cy.zoom({
                                level: cy.zoom() * 1.2,
                                position: { x: cy.width() / 2, y: cy.height() / 2 }
                            });
                        }
                    }}
                >
                    <ZoomIn size={20} />
                </motion.button>
                <motion.button
                    className="p-2 bg-slate-800/80 hover:bg-slate-700 text-white rounded-lg border border-slate-600 shadow-lg backdrop-blur-sm"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                        if (cy) {
                            cy.zoom({
                                level: cy.zoom() / 1.2,
                                position: { x: cy.width() / 2, y: cy.height() / 2 }
                            });
                        }
                    }}
                >
                    <ZoomOut size={20} />
                </motion.button>
            </div>
        </motion.div>
    );
};

export default GraphView;
