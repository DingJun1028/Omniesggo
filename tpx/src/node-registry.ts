import { NodeInfo } from './types.js';

export class NodeRegistry {
  private nodes = new Map<string, NodeInfo>();

  register(node: NodeInfo): void {
    this.nodes.set(node.id, node);
  }

  unregister(id: string): void {
    this.nodes.delete(id);
  }

  get(id: string): NodeInfo | undefined {
    return this.nodes.get(id);
  }

  list(): NodeInfo[] {
    return Array.from(this.nodes.values());
  }
}
