/* eslint-disable complexity */
import {
  forceCenter,
  forceLink,
  forceManyBody,
  forceSimulation,
  select,
  zoom,
  zoomIdentity,
} from 'd3';
import EventEMitter from 'eventemitter3';

const RADIUS = 5;
const RADIUS_2 = 5 ** 2;

const EDGE_COLOR = '#3d62c4';
const EDGE_WIDTH = 0.125;

const ARROWHEAD_H = 2;
const ARROWHEAD_W = 0.75;

const DEFAULT_BG_COLOR = '#CCCCCC';
const DEFAULT_FONT_COLOR = '#35425F';
const DEFAULT_LABEL_COLOR = '#623CEA';

const PI_2 = Math.PI * 2;

const PASS = (node) => node;

function max(numbers) {
  const max = Math.max(...numbers);
  return max === -Infinity ? 0 : max;
}

function min(numbers) {
  const min = Math.min(...numbers);
  return min === Infinity ? 0 : min;
}

function drawCircle(ctx, x, y, r, color) {
  ctx.beginPath(); // 새로운 경로 생성하는 함수
  ctx.arc(x, y, r, 0, PI_2, true); // 호나 원을 그리기 위한 함수
  ctx.fillStyle = color;
  ctx.fill(); // 경로의 내부를 채워서 내부가 채워진 도형을 그립니다.
}

function drawCircleImage(ctx, x, y, r, $image) {
  console.log($image);
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, PI_2, true);
  const imageSize = Math.min($image.width, $image.height);
  ctx.clip();
  ctx.drawImage(
    $image,
    ($image.width - imageSize) / 2,
    ($image.height - imageSize) / 2,
    imageSize,
    imageSize,
    x - r,
    y - r,
    r * 2,
    r * 2,
  );
  ctx.restore();
}

function drawSquare(ctx, x, y, r, color) {
  ctx.beginPath();
  ctx.rect(x - r, y - r, 2 * r, 2 * r); // 좌측상단이 (x-r, y-r)이고 폭과 높이가 2*r와 2*r인 직사각형을 그립니다. -> moveTo 메소드 자동 호출
  ctx.fillStyle = color;
  ctx.fill();
}

function drawEdge($ctx, edge) {
  console.log('드로우 엣지');
  const x1 = edge.source.x;
  const y1 = edge.source.y;
  const x2 = edge.target.x;
  const y2 = edge.target.y;

  if (!x1 || !y1 || !x2 || !y2) {
    return;
  }

  switch (edge.direction) {
    case 'none': {
      $ctx.beginPath();
      $ctx.moveTo(x1, y1); // 펜을  x와 y 로 지정된 좌표로 옮깁니다.
      $ctx.lineTo(x2, y2); // 현재의 드로잉 위치에서 x와 y로 지정된 위치까지 선을 그립니다.
      $ctx.lineWidth = EDGE_WIDTH;
      $ctx.strokeStyle = EDGE_COLOR;
      $ctx.stroke(); // 윤곽선을 이용하여 도형을 그립니다.
      break;
    }
    case 'duplex': {
      const len = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
      const cosX = (x2 - x1) / len;
      const sinX = (y2 - y1) / len;

      $ctx.beginPath();
      $ctx.moveTo(
        x1 + (RADIUS + ARROWHEAD_H / 2) * cosX,
        y1 + (RADIUS + ARROWHEAD_H / 2) * sinX,
      );
      $ctx.lineTo(
        x2 - (RADIUS + ARROWHEAD_H / 2) * cosX,
        y2 - (RADIUS + ARROWHEAD_H / 2) * sinX,
      );
      $ctx.lineWidth = EDGE_WIDTH;
      $ctx.strokeStyle = EDGE_COLOR;
      $ctx.stroke();

      $ctx.beginPath();
      $ctx.moveTo(x1 + RADIUS * cosX, y1 + RADIUS * sinX);
      $ctx.lineTo(
        x1 + (RADIUS + ARROWHEAD_H) * cosX - (ARROWHEAD_W / 2) * sinX,
        y1 + (RADIUS + ARROWHEAD_H) * sinX + (ARROWHEAD_W / 2) * cosX,
      );
      $ctx.lineTo(
        x1 + (RADIUS + ARROWHEAD_H) * cosX + (ARROWHEAD_W / 2) * sinX,
        y1 + (RADIUS + ARROWHEAD_H) * sinX - (ARROWHEAD_W / 2) * cosX,
      );
      $ctx.fillStyle = EDGE_COLOR;
      $ctx.fill();

      $ctx.beginPath();
      $ctx.moveTo(x2 - RADIUS * cosX, y2 - RADIUS * sinX);
      $ctx.lineTo(
        x2 - (RADIUS + ARROWHEAD_H) * cosX - (ARROWHEAD_W / 2) * sinX,
        y2 - (RADIUS + ARROWHEAD_H) * sinX + (ARROWHEAD_W / 2) * cosX,
      );
      $ctx.lineTo(
        x2 - (RADIUS + ARROWHEAD_H) * cosX + (ARROWHEAD_W / 2) * sinX,
        y2 - (RADIUS + ARROWHEAD_H) * sinX - (ARROWHEAD_W / 2) * cosX,
      );
      $ctx.fillStyle = EDGE_COLOR;
      $ctx.fill();
      break;
    }
    case 'target': {
      const len = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
      const cosX = (x2 - x1) / len;
      const sinX = (y2 - y1) / len;

      $ctx.beginPath();
      $ctx.moveTo(x1, y1);
      $ctx.lineTo(
        x2 - (RADIUS + ARROWHEAD_H / 2) * cosX,
        y2 - (RADIUS + ARROWHEAD_H / 2) * sinX,
      );
      $ctx.lineWidth = EDGE_WIDTH;
      $ctx.strokeStyle = EDGE_COLOR;
      $ctx.stroke();

      $ctx.beginPath();
      $ctx.moveTo(x2 - RADIUS * cosX, y2 - RADIUS * sinX);
      $ctx.lineTo(
        x2 - (RADIUS + ARROWHEAD_H) * cosX - (ARROWHEAD_W / 2) * sinX,
        y2 - (RADIUS + ARROWHEAD_H) * sinX + (ARROWHEAD_W / 2) * cosX,
      );
      $ctx.lineTo(
        x2 - (RADIUS + ARROWHEAD_H) * cosX + (ARROWHEAD_W / 2) * sinX,
        y2 - (RADIUS + ARROWHEAD_H) * sinX - (ARROWHEAD_W / 2) * cosX,
      );
      $ctx.fillStyle = EDGE_COLOR;
      $ctx.fill();
      break;
    }
    case 'source': {
      const len = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
      const cosX = (x2 - x1) / len;
      const sinX = (y2 - y1) / len;

      $ctx.beginPath();
      $ctx.moveTo(
        x1 + (RADIUS + ARROWHEAD_H / 2) * cosX,
        y1 + (RADIUS + ARROWHEAD_H / 2) * sinX,
      );
      $ctx.lineTo(x2, y2);
      $ctx.lineWidth = EDGE_WIDTH;
      $ctx.strokeStyle = EDGE_COLOR;
      $ctx.stroke();

      $ctx.beginPath();
      $ctx.moveTo(x1 + RADIUS * cosX, y1 + RADIUS * sinX);
      $ctx.lineTo(
        x1 + (RADIUS + ARROWHEAD_H) * cosX - (ARROWHEAD_W / 2) * sinX,
        y1 + (RADIUS + ARROWHEAD_H) * sinX + (ARROWHEAD_W / 2) * cosX,
      );
      $ctx.lineTo(
        x1 + (RADIUS + ARROWHEAD_H) * cosX + (ARROWHEAD_W / 2) * sinX,
        y1 + (RADIUS + ARROWHEAD_H) * sinX - (ARROWHEAD_W / 2) * cosX,
      );
      $ctx.fillStyle = EDGE_COLOR;
      $ctx.fill();
      break;
    }
  }
}

function drawNode($ctx, node) {
  console.log('드로우 노드');
  const x = node.x;
  const y = node.y;
  if (!x || !y) {
    return;
  }
  switch (node.shape) {
    case 'square': {
      const size = RADIUS;
      if (node.outlineWidth && node.outlineColor) {
        drawSquare($ctx, x, y, size + node.outlineWidth, node.outlineColor);
      }
      $ctx.save();
      $ctx.beginPath();
      $ctx.rect(x - size, y - size, size * 2, size * 2);
      if (node.image) {
        if (node.$image?.width && node.$image.height) {
          const size = Math.min(node.$image.width, node.$image.height);
          $ctx.clip();
          $ctx.drawImage(
            // This adds the width and height parameters, which indicate the size to which to scale the image when drawing it onto the canvas.

            node.$image,
            (node.$image.width - size) / 2,
            (node.$image.height - size) / 2,
            size,
            size,
            x - RADIUS,
            y - RADIUS,
            RADIUS * 2,
            RADIUS * 2,
          );
        } else {
          node.$image = Object.assign(new Image(), { src: node.image });
          $ctx.fillStyle = node.bgColor ?? DEFAULT_BG_COLOR;
          $ctx.fill();
        }
      } else {
        $ctx.fillStyle = node.bgColor ?? DEFAULT_BG_COLOR;
        $ctx.fill();
      }
      $ctx.restore();
      break;
    }
    case 'circle': {
      const size = RADIUS;
      if (node.outlineWidth && node.outlineColor) {
        drawCircle($ctx, x, y, size + node.outlineWidth, node.outlineColor);
      }
      if (node.image) {
        if (node.$image?.width && node.$image?.height) {
          drawCircleImage($ctx, x, y, size, node.$image);
        } else {
          node.$image = Object.assign(new Image(), { src: node.image });
          drawCircle($ctx, x, y, size, node.bgColor ?? DEFAULT_BG_COLOR);
        }
      } else {
        drawCircle($ctx, x, y, size, node.bgColor ?? DEFAULT_BG_COLOR);
      }
      if (node.badgeColor) {
        const badgeX = x + size * 0.7071; // sin(PI / 4)
        const badgeY = y - size * 0.7071; // sin(PI / 4)
        drawCircle($ctx, badgeX, badgeY, 1.125, '#FFFFFF');
        drawCircle($ctx, badgeX, badgeY, 0.875, node.badgeColor);
      }
      break;
    }
    case 'text': {
      if (node.label) {
        $ctx.save();
        $ctx.font = '1.75px sans-serif';
        $ctx.textAlign = 'center';
        $ctx.textBaseline = 'middle';
        const { width } = $ctx.measureText(node.label);

        $ctx.beginPath();
        $ctx.moveTo(x - width / 2, y - 1.5);
        $ctx.lineTo(x + width / 2, y - 1.5);
        $ctx.arc(x + width / 2, y, 1.5, Math.PI / -2, Math.PI / 2);
        $ctx.lineTo(x + width / 2, y + 1.5);
        $ctx.lineTo(x - width / 2, y + 1.5);
        $ctx.arc(x - width / 2, y, 1.5, Math.PI / 2, Math.PI / -2);
        $ctx.fillStyle = '#333333';
        $ctx.fill();

        $ctx.fillStyle = '#FFFFFF';
        $ctx.fillText(node.label, x, y);
        $ctx.restore();
      }
      break;
    }
  }
}

function drawSummaryNode($ctx, node) {
  console.log('드로우 서머리 노드');
  const x = node.x;
  const y = node.y;
  if (!x || !y) {
    return;
  }
  switch (node.shape) {
    case 'square': {
      const size = RADIUS;
      if (node.outlineWidth && node.outlineColor) {
        drawSquare($ctx, x, y, size + node.outlineWidth, node.outlineColor);
      }
      drawSquare($ctx, x, y, size, node.bgColor ?? DEFAULT_BG_COLOR);
      break;
    }
    case 'circle':
    case 'text': {
      const size = RADIUS;
      if (node.outlineWidth && node.outlineColor) {
        drawCircle($ctx, x, y, size + node.outlineWidth, node.outlineColor);
      }
      drawCircle($ctx, x, y, size, node.bgColor ?? DEFAULT_BG_COLOR);
      if (node.badgeColor) {
        const badgeX = x + size * 0.7071; // sin(PI / 4)
        const badgeY = y - size * 0.7071; // sin(PI / 4)
        drawCircle($ctx, badgeX, badgeY, 1.125, '#FFFFFF');
        drawCircle($ctx, badgeX, badgeY, 0.875, node.badgeColor);
      }
      break;
    }
  }
}

function drawLabel($ctx, node) {
  console.log('드로우 라벨');
  if (!node.label) {
    return;
  }
  const x = node.x;
  const y = node.y;
  if (!x || !y) {
    return;
  }

  if (node.emphasize) {
    $ctx.fillStyle = node.fontColor ?? DEFAULT_FONT_COLOR;
    $ctx.font = '5.75px sans-serif';
    $ctx.textAlign = 'center';
    $ctx.textBaseline = 'middle';
    $ctx.fillText(node.label, x, y);
    return;
  }

  if (node.shape === 'text') {
  } else {
    $ctx.save();
    $ctx.font = '1.75px sans-serif';
    $ctx.textAlign = 'center';
    $ctx.textBaseline = 'middle';
    const { width } = $ctx.measureText(node.label);

    $ctx.beginPath();
    $ctx.moveTo(x - width / 2, y + RADIUS + 2 - 1.5);
    $ctx.lineTo(x + width / 2, y + RADIUS + 2 - 1.5);
    $ctx.arc(x + width / 2, y + RADIUS + 2, 1.5, Math.PI / -2, Math.PI / 2);
    $ctx.lineTo(x + width / 2, y + RADIUS + 2 + 1.5);
    $ctx.lineTo(x - width / 2, y + RADIUS + 2 + 1.5);
    $ctx.arc(x - width / 2, y + RADIUS + 2, 1.5, Math.PI / 2, Math.PI / -2);
    $ctx.fillStyle = node.labelColor ?? DEFAULT_LABEL_COLOR;
    $ctx.fill();

    $ctx.fillStyle = '#FFFFFF';
    $ctx.fillText(node.label, x, y + RADIUS + 2);
    $ctx.restore();
  }
}

export class NetworkGraph extends EventEMitter {
  constructor($canvas, initDatas) {
    console.log('constructor start', $canvas, initDatas);
    super();
    initDatas = initDatas ?? {};
    const { width, height } = $canvas.getBoundingClientRect();

    this.renderTick = null;
    this.$canvas = $canvas;
    this.width = $canvas.width = width;
    this.height = $canvas.height = height;

    this.$forceCenter = forceCenter(width / 2, height / 2);
    this.$forceLink = forceLink()
      .id((node) => node.id)
      .distance(({ distance }) => distance ?? 40);

    this.$simulator = forceSimulation()
      .force('charge', forceManyBody())
      .force('center', this.$forceCenter)
      .force('link', this.$forceLink);

    if (initDatas.$simulator?.alpha) {
      this.$simulator.alpha(initDatas.$simulator.alpha);
    }

    this.nodes = initDatas.nodes ?? [];
    this.nodeIndexes = new Map(this.nodes.map((node) => [node.id, node]));
    this.edges = initDatas.edges ?? [];
    this.edgeIndexes = new Map(
      this.edges.map((edge) => {
        const source =
          typeof edge.source === 'object' ? edge.source.id : edge.source;
        const target =
          typeof edge.target === 'object' ? edge.target.id : edge.target;
        let edgeId = `${source}|${target}`;
        if (source > target) {
          edgeId = `${target}|${source}`;
          [edge.source, edge.target] = [edge.target, edge.source]; // swap
          if (edge.direction === 'target') {
            edge.direction = 'source';
          } else if (edge.direction === 'source') {
            edge.direction = 'target';
          }
        }
        return [edgeId, edge];
      }),
    );
    console.log(this.edgeIndexes);

    this.$simulator.nodes(this.nodes);
    this.$forceLink.links(this.edges);

    this.onTick = this.onTick.bind(this);
    this.onClick = this.onClick.bind(this);
    this.onMove = this.onMove.bind(this);

    this.$simulator.on('tick', this.onTick);
    $canvas.addEventListener('click', this.onClick);
    $canvas.addEventListener('mousemove', this.onMove);

    const selectedCanvas = select($canvas).call(
      zoom()
        .scaleExtent([1 / 10, 8])
        .on('zoom', this.onZoom.bind(this)),
    );
    this.$transform = zoomIdentity;

    if (initDatas.$transform) {
      this.$transform = zoomIdentity
        .translate(initDatas.$transform.x, initDatas.$transform.y)
        .scale(initDatas.$transform.k);
    }

    selectedCanvas.property('__zoom', () => this.$transform);
    console.log('constructor end');
  }

  dump() {
    console.log('dump');
    return {
      nodes: this.nodes.slice(),
      edges: this.edges.map(({ source, target, distance, direction }) => ({
        source: typeof source === 'object' ? source.id : source,
        target: typeof target === 'object' ? target.id : target,
        distance,
        direction,
      })),
      $transform: this.$transform,
      $simulator: {
        alpha: this.$simulator.alpha(),
      },
    };
  }

  clear() {
    console.log('clear');
    this.nodes = [];
    this.nodeIndexes.clear();
    this.edges = [];
    this.edgeIndexes.clear();
    this.render();
  }

  destroy() {
    console.log('destroy');
    this.$simulator.stop();
    this.$canvas?.removeEventListener('click', this.onClick);
    this.$canvas?.removeEventListener('mousemove', this.onMove);
  }

  resize() {
    console.log('resize');
    const { width, height } = this.$canvas.getBoundingClientRect();

    this.width = this.$canvas.width = width;
    this.height = this.$canvas.height = height;

    this.$forceCenter.x(width / 2).y(height / 2);
    this.onTick();
  }

  focusNode(id) {
    console.log('focusNode');
    const foundNode = this.$simulator.nodes().find((node) => node.id === id);
    if (foundNode?.x && foundNode?.y) {
      const targetX = foundNode.x;
      const targetY = foundNode.y;
      this.$transform.applyX(targetX - this.width / 2);
      this.$transform.applyY(targetY - this.height / 2);
    }
  }

  pushOrMergeNode(node, merge) {
    console.log('pushOrMergeNode');
    const foundNode = this.nodeIndexes.get(node.id);
    if (!foundNode) {
      this.nodes.push(node);
      this.nodeIndexes.set(node.id, node);
      this.render();
    } else {
      Object.assign(foundNode, merge(foundNode));
      this.onTick();
    }
  }

  getGraphPositionAndSize() {
    console.log('getGraphPositionAndSize');
    const isNumber = (d) => d;
    const [minX, maxX, minY, maxY] = [
      min(this.nodes.map((node) => node.x ?? 0).filter(isNumber)),
      max(this.nodes.map((node) => node.x ?? 0).filter(isNumber)),
      min(this.nodes.map((node) => node.y ?? 0).filter(isNumber)),
      max(this.nodes.map((node) => node.y ?? 0).filter(isNumber)),
    ];

    const width = maxX - minX;
    const height = maxY - minY;

    const center = {
      x: width / 2 + minX,
      y: height / 2 + minY,
    };
    return {
      width,
      height,
      center,
    };
  }

  addNodeOrMerge(node, merge, beforeNode) {
    console.log('addNodeOrMerge');
    const foundNode = this.nodeIndexes.get(node.id);
    console.log('addNodeOrMerge', node);

    if (!foundNode) {
      const { width, height, center } = this.getGraphPositionAndSize();
      const r = Math.max(width, height) / 2;
      const degree = Math.random() * 360;
      const x = r * Math.cos(degree * (Math.PI / 180)) + center.x;
      const y = r * Math.sin(degree * (Math.PI / 180)) + center.y;
      Object.assign(node, { x, y });
      this.nodes.push(node);
      this.nodeIndexes.set(node.id, node);

      this.render();
    } else {
      Object.assign(foundNode, merge(node, foundNode));
      this.onTick();
    }
  }

  addNode(node) {
    console.log('addNode');
    this.addNodeOrMerge(node, PASS);
  }

  addEdge({ source, target, direction, distance }) {
    console.log('addEdge', direction);
    let edgeId = `${source}|${target}`;
    if (source > target) {
      edgeId = `${target}|${source}`;
      [source, target] = [target, source]; // swap
      if (direction === 'target') {
        direction = 'source';
      } else if (direction === 'source') {
        direction = 'target';
      }
    }
    const foundEdge = this.edgeIndexes.get(edgeId);
    if (!foundEdge) {
      const edge = {
        source,
        target,
        distance,
        direction: direction ?? 'none',
      };
      this.edges.push(edge);
      this.edgeIndexes.set(edgeId, edge);
      this.render();
    } else {
      if (
        direction === 'duplex' ||
        (foundEdge.direction === 'source' && direction === 'target') ||
        (foundEdge.direction === 'target' && direction === 'source')
      ) {
        Object.assign(foundEdge, { direction: 'duplex' });
      }
      this.onTick();
    }
  }

  findNodeByPosition(x, y) {
    // console.log('findNodeByPosition');
    for (const node of this.$simulator.nodes()) {
      const dx = x - node.x;
      const dy = y - node.y;
      if (dx ** 2 + dy ** 2 < RADIUS_2) {
        return node;
      }
    }
    return null;
  }

  onClick(e) {
    console.log('onClick');
    const { left, top } = e.target.getBoundingClientRect();
    const node = this.findNodeByPosition(
      this.$transform.invertX(e.x - left),
      this.$transform.invertY(e.y - top),
    );
    if (!node || node.hidden) {
      return;
    }
    this.emit('click_node', node);
  }

  onMove(e) {
    // console.log('onMove');
    const { left, top } = e.target.getBoundingClientRect();
    const node = this.findNodeByPosition(
      this.$transform.invertX(e.x - left),
      this.$transform.invertY(e.y - top),
    );
    if (this.latestMovedNode === node) {
      this.emit('move_node', node);
    } else if (!this.latestMovedNode && node) {
      this.emit('enter_node', node);
    } else {
      this.emit('leave_node', this.latestMovedNode);
    }
    this.latestMovedNode = node;
  }

  onZoom(event) {
    // console.log('onZoom');
    this.$transform = event.transform;
    this.onTick();
    this.emit('zoom');
  }

  onTick() {
    console.log('onTick');
    const $ctx = this.$canvas?.getContext('2d');
    if ($ctx) {
      this.onDrawGraph($ctx);
    }
  }

  onDrawGraph($ctx) {
    console.log('onDrawGraph');
    console.log('그래프 그리기 시작');
    $ctx.save();
    $ctx.clearRect(0, 0, this.width, this.height);

    $ctx.translate(this.$transform.x, this.$transform.y);
    $ctx.scale(this.$transform.k, this.$transform.k);

    for (const edge of this.$forceLink.links()) {
      if (edge.source.hidden || edge.target.hidden) {
        continue;
      }
      drawEdge($ctx, edge);
    }

    if (this.$transform.k > 3) {
      for (const node of this.$simulator.nodes()) {
        if (node.hidden) {
          continue;
        }
        drawNode($ctx, node);
      }
      for (const node of this.$simulator.nodes()) {
        if (node.hidden) {
          continue;
        }
        drawLabel($ctx, node);
      }
    } else {
      for (const node of this.$simulator.nodes()) {
        if (node.hidden) {
          continue;
        }
        drawSummaryNode($ctx, node);
      }
      for (const node of this.$simulator.nodes()) {
        if (node.hidden) {
          continue;
        }
        if (node.emphasize) {
          drawLabel($ctx, node);
        }
      }
    }
    $ctx.restore();
    console.log('그래프 그리기 ㄲㅡㅌ');
  }

  render() {
    console.log('render start');
    console.log(this.renderTick);

    if (!this.renderTick) {
      this.renderTick = setTimeout(() => {
        this.renderTick = null;
        this.$simulator.nodes(this.nodes);
        this.$forceLink.links(this.edges);
        this.$simulator.alpha(0.1).restart();
      }, 0);
    }
    console.log('render end');
  }
}
