import type { Metadata } from 'next';
import NotesClient from './NotesClient';

export const metadata: Metadata = {
  title: '萬能筆記 Universal Notes',
  description: 'Universal note-taking interface: list, search, tag, edit, preview and manage notes.',
};

export default function NotesPage() {
  return <NotesClient />;
}
