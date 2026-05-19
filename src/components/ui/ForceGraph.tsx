import React, { useRef, useEffect, useCallback } from 'react';
import { Network } from 'vis-network';
import { DataSet } from 'vis-data';
import type { Card, CardLink, Notebook } from '../../types';

interface ForceGraphProps {
  cards: Card[];
  cardLinks: CardLink[];
  notebooks: Notebook[];
  selectedNotebookId: string | null;
  onCardClick: (card: Card | null) => void;
  highlightCardId: string | null;
}

const NODE_COLORS = [
  '#cc785c', '#5db8a6', '#e8a55a', '#8b9dc3', '#b88cb0',
  '#7cae7c', '#c48a7c', '#8fb0b0', '#c0a080', '#a08cb0',
];

const getNodeColor = (notebookId: string, notebooks: Notebook[]): string => {
  const idx = notebooks.findIndex(n => n.id === notebookId);
  return NODE_COLORS[idx >= 0 ? idx % NODE_COLORS.length : 0];
};

const ForceGraph: React.FC<ForceGraphProps> = ({ cards, cardLinks, notebooks, selectedNotebookId, onCardClick, highlightCardId }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const networkRef = useRef<Network | null>(null);

  const filteredCards = selectedNotebookId
    ? cards.filter(c => c.notebookId === selectedNotebookId)
    : cards;

  const filteredCardIds = new Set(filteredCards.map(c => c.id));
  const filteredLinks = cardLinks.filter(l => filteredCardIds.has(l.sourceId) && filteredCardIds.has(l.targetId));

  const cardMap = useRef(new Map<string, Card>());
  cardMap.current = new Map(cards.map(c => [c.id, c]));

  const stripWikilinks = (text: string) => text.replace(/\[\[([^\]]+)\]\]/g, '$1');

  useEffect(() => {
    if (!containerRef.current) return;

    const nodes = new DataSet<{ id: string; label: string; title: string; shape: string; color: { background: string; border: string }; borderWidth: number; size: number; font: { size: number; color: string; strokeWidth: number; strokeColor: string } }>();
    const edges = new DataSet<{ id: string; from: string; to: string; arrows: string; color: { color: string; highlight: string }; width: number; smooth: { enabled: boolean; type: string; roundness: number } }>();

    filteredCards.forEach(card => {
      const frontText = stripWikilinks(card.type === 'cloze' ? card.front.replace(/\{\{([^}]+)\}\}/g, '____') : card.front);
      const bgColor = getNodeColor(card.notebookId, notebooks);
      nodes.add({
        id: card.id,
        label: frontText.length > 20 ? frontText.slice(0, 20) + '…' : frontText,
        title: frontText,
        shape: card.type === 'cloze' ? 'diamond' : 'dot',
        color: { background: bgColor, border: bgColor },
        borderWidth: 0,
        size: 18 + Math.min(card.reviewCount, 10) * 1.5,
        font: { size: 11, color: '#6c6a64', strokeWidth: 0, strokeColor: '' },
      });
    });

    filteredLinks.forEach(link => {
      if (link.targetId && filteredCardIds.has(link.targetId)) {
        edges.add({
          id: link.id,
          from: link.sourceId,
          to: link.targetId,
          arrows: 'to',
          color: { color: '#e6dfd8', highlight: '#cc785c' },
          width: 1.2,
          smooth: { enabled: true, type: 'curvedCW', roundness: 0.15 },
        });
      }
    });

    const options = {
      physics: {
        solver: 'forceAtlas2Based',
        forceAtlas2Based: { gravitationalConstant: -40, centralGravity: 0.005, springLength: 160, springConstant: 0.02, damping: 0.4 },
        stabilization: { iterations: 100 },
      },
      interaction: {
        hover: true,
        tooltipDelay: 200,
        zoomView: true,
        dragView: true,
      },
      nodes: {
        borderWidth: 0,
        borderWidthSelected: 2,
      },
      edges: {
        smooth: { enabled: true, type: 'curvedCW', roundness: 0.15 },
        chosen: false,
      },
      layout: { improvedLayout: true },
    } as any;

    const network = new Network(containerRef.current, { nodes, edges }, options);

    network.on('click', (params) => {
      if (params.nodes.length > 0) {
        const cardId = params.nodes[0];
        const card = cardMap.current.get(cardId);
        if (card) onCardClick(card);
      } else {
        onCardClick(null);
      }
    });

    networkRef.current = network;

    return () => {
      network.destroy();
      networkRef.current = null;
    };
  }, [filteredCards, filteredLinks, notebooks, onCardClick]);

  useEffect(() => {
    if (!networkRef.current) return;
    if (highlightCardId) {
      networkRef.current.selectNodes([highlightCardId], false);
    } else {
      networkRef.current.selectNodes([]);
    }
  }, [highlightCardId]);

  const connectedCount = new Set(filteredLinks.flatMap(l => [l.sourceId, l.targetId])).size;

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full rounded-xl" />
      <div className="absolute bottom-4 left-4 flex gap-3 text-xs text-muted bg-canvas/80 backdrop-blur-sm px-3 py-2 rounded-lg border border-hairline">
        <span>节点: {filteredCards.length}</span>
        <span>关联: {filteredLinks.length}</span>
        <span>连通: {connectedCount}</span>
      </div>
    </div>
  );
};

export default ForceGraph;