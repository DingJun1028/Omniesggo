// ═══════════════════════════════════════════════════════════════
// 萬能待辦 OmniTodo — Engine Tests
// ═══════════════════════════════════════════════════════════════

import { describe, it, expect, beforeEach } from 'vitest';
import { OmniTodoEngine } from '../engine';
import { InMemoryTodoStore } from '../store';
import type { TodoItem } from '../types';

describe('OmniTodoEngine', () => {
  let engine: OmniTodoEngine;

  beforeEach(() => {
    engine = new OmniTodoEngine();
  });

  // ── CRUD ──────────────────────────────────────────────────

  describe('createTodo', () => {
    it('should create a todo with defaults', () => {
      const todo = engine.createTodo({ title: 'Test Todo' });

      expect(todo.id).toBeDefined();
      expect(todo.title).toBe('Test Todo');
      expect(todo.description).toBe('');
      expect(todo.priority).toBe('medium');
      expect(todo.status).toBe('pending');
      expect(todo.category).toBe('general');
      expect(todo.tags).toEqual([]);
      expect(todo.subtaskIds).toEqual([]);
      expect(todo.notes).toEqual([]);
      expect(todo.attachments).toEqual([]);
      expect(todo.createdAt).toBeDefined();
      expect(todo.updatedAt).toBeDefined();
    });

    it('should create a todo with all options', () => {
      const todo = engine.createTodo({
        title: 'ESG Carbon Audit',
        description: 'ISO 14064 碳盤查',
        priority: 'urgent',
        category: 'esg_carbon',
        tags: ['iso14064', 'carbon'],
        dueDate: '2026-12-31',
        esgTaskType: 'carbon_calculation',
        companyId: 'TSMC',
        createdBy: 'admin',
      });

      expect(todo.title).toBe('ESG Carbon Audit');
      expect(todo.description).toBe('ISO 14064 碳盤查');
      expect(todo.priority).toBe('urgent');
      expect(todo.category).toBe('esg_carbon');
      expect(todo.tags).toEqual(['iso14064', 'carbon']);
      expect(todo.dueDate).toBe('2026-12-31');
      expect(todo.esgTaskType).toBe('carbon_calculation');
      expect(todo.companyId).toBe('TSMC');
      expect(todo.createdBy).toBe('admin');
    });

    it('should reject empty title', () => {
      expect(() => engine.createTodo({ title: '' })).toThrow('Title is required');
      expect(() => engine.createTodo({ title: '   ' })).toThrow('Title is required');
    });

    it('should trim title and description', () => {
      const todo = engine.createTodo({
        title: '  Test  ',
        description: '  Description  ',
      });

      expect(todo.title).toBe('Test');
      expect(todo.description).toBe('Description');
    });
  });

  describe('updateTodo', () => {
    it('should update todo fields', () => {
      const todo = engine.createTodo({ title: 'Test' });
      // Small delay to ensure different timestamp
      const updated = engine.updateTodo(todo.id, { title: 'Updated', priority: 'high' });

      expect(updated).toBeDefined();
      expect(updated!.title).toBe('Updated');
      expect(updated!.priority).toBe('high');
      expect(updated!.updatedAt >= todo.updatedAt).toBe(true);
    });

    it('should return undefined for non-existent id', () => {
      const result = engine.updateTodo('non-existent', { title: 'X' });
      expect(result).toBeUndefined();
    });

    it('should auto-set completedAt when status changes to done', () => {
      const todo = engine.createTodo({ title: 'Test' });
      engine.startTodo(todo.id);
      const completed = engine.completeTodo(todo.id);

      expect(completed!.status).toBe('done');
      expect(completed!.completedAt).toBeDefined();
    });

    it('should auto-set archivedAt when status changes to archived', () => {
      const todo = engine.createTodo({ title: 'Test' });
      engine.startTodo(todo.id);
      engine.completeTodo(todo.id);
      const archived = engine.archiveTodo(todo.id);

      expect(archived!.status).toBe('archived');
      expect(archived!.archivedAt).toBeDefined();
    });
  });

  describe('deleteTodo', () => {
    it('should delete existing todo', () => {
      const todo = engine.createTodo({ title: 'Test' });
      const result = engine.deleteTodo(todo.id);
      expect(result).toBe(true);
      expect(engine.getTodo(todo.id)).toBeUndefined();
    });

    it('should return false for non-existent id', () => {
      const result = engine.deleteTodo('non-existent');
      expect(result).toBe(false);
    });
  });

  // ── 狀態變更 ──────────────────────────────────────────────

  describe('status transitions', () => {
    it('should start a pending todo', () => {
      const todo = engine.createTodo({ title: 'Test' });
      const started = engine.startTodo(todo.id);

      expect(started!.status).toBe('in_progress');
    });

    it('should complete a pending todo', () => {
      const todo = engine.createTodo({ title: 'Test' });
      const completed = engine.completeTodo(todo.id);

      expect(completed!.status).toBe('done');
    });

    it('should complete an in_progress todo', () => {
      const todo = engine.createTodo({ title: 'Test' });
      engine.startTodo(todo.id);
      const completed = engine.completeTodo(todo.id);

      expect(completed!.status).toBe('done');
    });

    it('should archive a done todo', () => {
      const todo = engine.createTodo({ title: 'Test' });
      engine.startTodo(todo.id);
      engine.completeTodo(todo.id);
      const archived = engine.archiveTodo(todo.id);

      expect(archived!.status).toBe('archived');
    });

    it('should reopen a done todo', () => {
      const todo = engine.createTodo({ title: 'Test' });
      engine.startTodo(todo.id);
      engine.completeTodo(todo.id);
      const reopened = engine.reopenTodo(todo.id);

      expect(reopened!.status).toBe('pending');
      expect(reopened!.completedAt).toBeUndefined();
    });

    it('should reject invalid transitions', () => {
      const todo = engine.createTodo({ title: 'Test' });

      // Cannot start an already started todo
      engine.startTodo(todo.id);
      const result = engine.startTodo(todo.id);
      expect(result).toBeUndefined();

      // Cannot archive a pending todo
      const archiveResult = engine.archiveTodo(todo.id);
      expect(archiveResult).toBeUndefined();
    });
  });

  // ── 子任務 ────────────────────────────────────────────────

  describe('addSubtask', () => {
    it('should add subtask to parent', () => {
      const parent = engine.createTodo({ title: 'Parent' });
      const subtask = engine.addSubtask(parent.id, { title: 'Subtask 1' });

      expect(subtask.parentId).toBe(parent.id);
      expect(subtask.status).toBe('pending');

      const updatedParent = engine.getTodo(parent.id);
      expect(updatedParent!.subtaskIds).toContain(subtask.id);
    });

    it('should inherit parent category and tags', () => {
      const parent = engine.createTodo({
        title: 'Parent',
        category: 'esg_carbon',
        tags: ['iso14064'],
      });
      const subtask = engine.addSubtask(parent.id, { title: 'Sub' });

      expect(subtask.category).toBe('esg_carbon');
      expect(subtask.tags).toEqual(['iso14064']);
    });

    it('should throw for non-existent parent', () => {
      expect(() => engine.addSubtask('non-existent', { title: 'Sub' })).toThrow('Parent not found');
    });
  });

  // ── 附註 ──────────────────────────────────────────────────

  describe('addNote', () => {
    it('should add note to todo', () => {
      const todo = engine.createTodo({ title: 'Test' });
      const updated = engine.addNote(todo.id, 'First note');

      expect(updated!.notes).toEqual(['First note']);
    });

    it('should append multiple notes', () => {
      const todo = engine.createTodo({ title: 'Test' });
      engine.addNote(todo.id, 'Note 1');
      const updated = engine.addNote(todo.id, 'Note 2');

      expect(updated!.notes).toEqual(['Note 1', 'Note 2']);
    });

    it('should return undefined for non-existent id', () => {
      const result = engine.addNote('non-existent', 'Note');
      expect(result).toBeUndefined();
    });
  });

  // ── 查詢 ──────────────────────────────────────────────────

  describe('query', () => {
    beforeEach(() => {
      engine.createTodo({ title: 'Urgent ESG', priority: 'urgent', category: 'esg_carbon' });
      engine.createTodo({ title: 'High Work', priority: 'high', category: 'work' });
      engine.createTodo({ title: 'Medium General', priority: 'medium', category: 'general' });
      engine.createTodo({ title: 'Low Personal', priority: 'low', category: 'personal' });
    });

    it('should return all items without filter', () => {
      const result = engine.query({});
      expect(result.total).toBe(4);
    });

    it('should filter by priority', () => {
      const result = engine.query({ priority: ['urgent'] });
      expect(result.total).toBe(1);
      expect(result.items[0].title).toBe('Urgent ESG');
    });

    it('should filter by category', () => {
      const result = engine.query({ category: ['work'] });
      expect(result.total).toBe(1);
      expect(result.items[0].title).toBe('High Work');
    });

    it('should filter by search query', () => {
      const result = engine.query({ search: 'ESG' });
      expect(result.total).toBe(1);
      expect(result.items[0].title).toBe('Urgent ESG');
    });

    it('should support pagination', () => {
      const result = engine.query({}, undefined, 1, 2);
      expect(result.items.length).toBe(2);
      expect(result.total).toBe(4);
      expect(result.totalPages).toBe(2);
    });
  });

  // ── 統計 ──────────────────────────────────────────────────

  describe('getStats', () => {
    it('should return correct stats', () => {
      engine.createTodo({ title: 'T1', priority: 'urgent', category: 'esg_carbon' });
      engine.createTodo({ title: 'T2', priority: 'high', category: 'work' });
      const t3 = engine.createTodo({ title: 'T3', priority: 'medium', category: 'general' });
      engine.startTodo(t3.id);

      const stats = engine.getStats();

      expect(stats.total).toBe(3);
      expect(stats.byPriority.urgent).toBe(1);
      expect(stats.byPriority.high).toBe(1);
      expect(stats.byStatus.pending).toBe(2);
      expect(stats.byStatus.in_progress).toBe(1);
      expect(stats.byCategory.esg_carbon).toBe(1);
      expect(stats.byCategory.work).toBe(1);
    });
  });

  // ── 特殊查詢 ──────────────────────────────────────────────

  describe('special queries', () => {
    it('should get overdue items', () => {
      engine.createTodo({
        title: 'Overdue',
        dueDate: '2020-01-01',
      });
      engine.createTodo({
        title: 'Future',
        dueDate: '2099-12-31',
      });

      const overdue = engine.getOverdue();
      expect(overdue.length).toBe(1);
      expect(overdue[0].title).toBe('Overdue');
    });

    it('should get ESG todos', () => {
      engine.createTodo({ title: 'Carbon', category: 'esg_carbon' });
      engine.createTodo({ title: 'Compliance', category: 'esg_compliance' });
      engine.createTodo({ title: 'General', category: 'general' });

      const esg = engine.getESGTodos();
      expect(esg.length).toBe(2);
    });

    it('should get ESG todos by company', () => {
      engine.createTodo({ title: 'Carbon TSMC', category: 'esg_carbon', companyId: 'TSMC' });
      engine.createTodo({ title: 'Carbon ASUS', category: 'esg_carbon', companyId: 'ASUS' });

      const ts = engine.getESGTodos('TSMC');
      expect(ts.length).toBe(1);
      expect(ts[0].title).toBe('Carbon TSMC');
    });
  });

  // ── 批次操作 ──────────────────────────────────────────────

  describe('batch operations', () => {
    it('should batch update status', () => {
      const t1 = engine.createTodo({ title: 'T1' });
      const t2 = engine.createTodo({ title: 'T2' });
      const t3 = engine.createTodo({ title: 'T3' });

      const results = engine.batchUpdateStatus([t1.id, t2.id], 'done');
      expect(results.length).toBe(2);

      const stats = engine.getStats();
      expect(stats.byStatus.done).toBe(2);
      expect(stats.byStatus.pending).toBe(1);
    });

    it('should batch delete', () => {
      const t1 = engine.createTodo({ title: 'T1' });
      const t2 = engine.createTodo({ title: 'T2' });
      engine.createTodo({ title: 'T3' });

      const count = engine.batchDelete([t1.id, t2.id]);
      expect(count).toBe(2);
      expect(engine.getStats().total).toBe(1);
    });
  });

  // ── 匯出 ──────────────────────────────────────────────────

  describe('export', () => {
    it('should export as JSON', () => {
      engine.createTodo({ title: 'Test', priority: 'high' });
      const json = engine.exportJSON();
      const parsed = JSON.parse(json);

      expect(parsed.length).toBe(1);
      expect(parsed[0].title).toBe('Test');
    });

    it('should export as Markdown', () => {
      engine.createTodo({ title: 'Pending Task' });
      const md = engine.exportMarkdown();

      expect(md).toContain('萬能待辦 OmniTodo 匯出');
      expect(md).toContain('Pending Task');
    });
  });
});
