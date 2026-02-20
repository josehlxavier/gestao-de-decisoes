import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { FileText, Plus, Pencil, Trash2, Calendar, Users, ArrowRight } from 'lucide-react'

function formatDate(d) {
  if (!d) return ''
  return new Date(d + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const EMPTY = { title: '', date: '', working_group_id: '', summary: '' }

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState([])
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [filterGroup, setFilterGroup] = useState('all')

  async function loadAll() {
    const [m, g] = await Promise.all([
      supabase.from('meetings').select('*, working_groups(name)').order('date', { ascending: false }),
      supabase.from('working_groups').select('id, name').order('name'),
    ])
    setMeetings(m.data || [])
    setGroups(g.data || [])
    setLoading(false)
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { loadAll() }, [])


  function openNew() { setEditing(null); setForm(EMPTY); setOpen(true) }
  function openEdit(m) {
    setEditing(m)
    setForm({ title: m.title, date: m.date, working_group_id: m.working_group_id, summary: m.summary || '' })
    setOpen(true)
  }

  async function save() {
    if (!form.title.trim() || !form.date || !form.working_group_id) return
    setSaving(true)
    if (editing) {
      await supabase.from('meetings').update(form).eq('id', editing.id)
    } else {
      await supabase.from('meetings').insert(form)
    }
    setSaving(false)
    setOpen(false)
    loadAll()
  }

  async function remove(id) {
    if (!confirm('Excluir esta ata? As decisões e tarefas vinculadas também serão removidas.')) return
    await supabase.from('meetings').delete().eq('id', id)
    loadAll()
  }

  const filtered = meetings.filter((m) => {
    const matchSearch =
      m.title.toLowerCase().includes(search.toLowerCase()) ||
      (m.summary || '').toLowerCase().includes(search.toLowerCase())
    const matchGroup = filterGroup === 'all' || m.working_group_id === filterGroup
    return matchSearch && matchGroup
  })

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-7 h-7 text-blue-600" />
            Atas de Reunião
          </h1>
          <p className="text-gray-500 text-sm mt-1">Registre e consulte as atas dos grupos de trabalho</p>
        </div>
        <Button onClick={openNew}>
          <Plus className="w-4 h-4" /> Nova Ata
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Buscar por título ou resumo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select value={filterGroup} onValueChange={setFilterGroup}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Grupo de Trabalho" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os GTs</SelectItem>
            {groups.map((g) => (
              <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Nenhuma ata encontrada</p>
          <p className="text-sm mt-1">Registre a primeira ata de reunião.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((m) => (
            <Card key={m.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900">{m.title}</h3>
                      {m.working_groups?.name && (
                        <Badge variant="secondary" className="text-xs">
                          <Users className="w-3 h-3 mr-1" />
                          {m.working_groups.name}
                        </Badge>
                      )}
                    </div>
                    {m.summary && (
                      <p className="text-sm text-gray-600 line-clamp-2 mt-1">{m.summary}</p>
                    )}
                    <div className="flex items-center gap-1 text-xs text-gray-400 mt-2">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatDate(m.date)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button variant="ghost" size="sm" asChild>
                      <Link to={`/reunioes/${m.id}`}>
                        Ver detalhes <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </Button>
                    <button
                      onClick={() => openEdit(m)}
                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => remove(m.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Ata' : 'Nova Ata de Reunião'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Título da Reunião *</Label>
              <Input
                placeholder="Ex: GT Pix Automático — Reunião Semanal"
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data *</Label>
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Grupo de Trabalho *</Label>
                <Select value={form.working_group_id} onValueChange={(v) => setForm((p) => ({ ...p, working_group_id: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar GT" />
                  </SelectTrigger>
                  <SelectContent>
                    {groups.map((g) => (
                      <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Resumo / Pauta</Label>
              <Textarea
                placeholder="Descreva os principais pontos discutidos..."
                value={form.summary}
                onChange={(e) => setForm((p) => ({ ...p, summary: e.target.value }))}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button
              onClick={save}
              disabled={saving || !form.title.trim() || !form.date || !form.working_group_id}
            >
              {saving ? 'Salvando...' : editing ? 'Salvar alterações' : 'Criar ata'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
