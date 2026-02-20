import React, { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Users, Plus, Pencil, Trash2, Calendar } from 'lucide-react'

function formatDate(d) {
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const EMPTY = { name: '', description: '' }

export default function WorkingGroupsPage() {
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')

  async function load() {
    const { data } = await supabase.from('working_groups').select('*').order('created_at', { ascending: false })
    setGroups(data || [])
    setLoading(false)
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load() }, [])


  function openNew() { setEditing(null); setForm(EMPTY); setOpen(true) }
  function openEdit(g) { setEditing(g); setForm({ name: g.name, description: g.description || '' }); setOpen(true) }

  async function save() {
    if (!form.name.trim()) return
    setSaving(true)
    if (editing) {
      await supabase.from('working_groups').update({ name: form.name, description: form.description }).eq('id', editing.id)
    } else {
      await supabase.from('working_groups').insert({ name: form.name, description: form.description })
    }
    setSaving(false)
    setOpen(false)
    load()
  }

  async function remove(id) {
    if (!confirm('Excluir este grupo de trabalho? As atas vinculadas também serão removidas.')) return
    await supabase.from('working_groups').delete().eq('id', id)
    load()
  }

  const filtered = groups.filter(
    (g) =>
      g.name.toLowerCase().includes(search.toLowerCase()) ||
      (g.description || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-7 h-7 text-blue-600" />
            Grupos de Trabalho
          </h1>
          <p className="text-gray-500 text-sm mt-1">Organize as equipes e comitês do projeto</p>
        </div>
        <Button onClick={openNew}>
          <Plus className="w-4 h-4" /> Novo GT
        </Button>
      </div>

      <Input
        placeholder="Buscar por nome ou descrição..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Nenhum grupo de trabalho encontrado</p>
          <p className="text-sm mt-1">Crie um novo grupo para começar.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map((g) => (
            <Card key={g.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base">{g.name}</CardTitle>
                  <div className="flex gap-1 flex-shrink-0">
                    <button
                      onClick={() => openEdit(g)}
                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => remove(g.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {g.description && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{g.description}</p>
                )}
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <Calendar className="w-3.5 h-3.5" />
                  Criado em {formatDate(g.created_at)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Grupo de Trabalho' : 'Novo Grupo de Trabalho'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome do Grupo *</Label>
              <Input
                placeholder="Ex: GT Pix Automático, GT Open Finance..."
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                placeholder="Descreva o objetivo e escopo deste grupo..."
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={save} disabled={saving || !form.name.trim()}>
              {saving ? 'Salvando...' : editing ? 'Salvar alterações' : 'Criar grupo'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
