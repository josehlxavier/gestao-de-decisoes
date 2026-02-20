import React, { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { AlertTriangle, Plus, Pencil, Trash2, Flame, Info } from 'lucide-react'

const GUT_LABELS = {
  1: '1 — Sem gravidade',
  2: '2 — Pouco grave',
  3: '3 — Grave',
  4: '4 — Muito grave',
  5: '5 — Extremamente grave',
}

const URGENCY_LABELS = {
  1: '1 — Pode esperar',
  2: '2 — Pouco urgente',
  3: '3 — Urgente',
  4: '4 — Muito urgente',
  5: '5 — Urgentíssimo',
}

const TENDENCY_LABELS = {
  1: '1 — Não vai mudar',
  2: '2 — Vai piorar a longo prazo',
  3: '3 — Vai piorar a médio prazo',
  4: '4 — Vai piorar a curto prazo',
  5: '5 — Vai piorar rapidamente',
}

const STATUS_OPTIONS = ['Aberto', 'Em Análise', 'Resolvido']

function getScoreColor(score) {
  if (score >= 75) return { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200', bar: 'bg-red-500', label: 'Crítico' }
  if (score >= 27) return { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-200', bar: 'bg-orange-400', label: 'Alto' }
  if (score >= 8) return { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200', bar: 'bg-yellow-400', label: 'Médio' }
  return { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200', bar: 'bg-green-400', label: 'Baixo' }
}

const EMPTY = { title: '', description: '', working_group_id: '', gravity: '3', urgency: '3', tendency: '3', status: 'Aberto' }

export default function IssuesPage() {
  const [issues, setIssues] = useState([])
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [filterGroup, setFilterGroup] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [search, setSearch] = useState('')

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    setLoading(true)
    const [i, g] = await Promise.all([
      supabase.from('issues').select('*, working_groups(name)').order('score', { ascending: false }),
      supabase.from('working_groups').select('id, name').order('name'),
    ])
    setIssues(i.data || [])
    setGroups(g.data || [])
    setLoading(false)
  }

  function openNew() { setEditing(null); setForm(EMPTY); setOpen(true) }
  function openEdit(issue) {
    setEditing(issue)
    setForm({
      title: issue.title,
      description: issue.description || '',
      working_group_id: issue.working_group_id,
      gravity: String(issue.gravity),
      urgency: String(issue.urgency),
      tendency: String(issue.tendency),
      status: issue.status,
    })
    setOpen(true)
  }

  async function save() {
    if (!form.title.trim() || !form.working_group_id) return
    setSaving(true)
    const payload = {
      title: form.title,
      description: form.description,
      working_group_id: form.working_group_id,
      gravity: Number(form.gravity),
      urgency: Number(form.urgency),
      tendency: Number(form.tendency),
      status: form.status,
    }
    if (editing) {
      await supabase.from('issues').update(payload).eq('id', editing.id)
    } else {
      await supabase.from('issues').insert(payload)
    }
    setSaving(false)
    setOpen(false)
    loadAll()
  }

  async function remove(id) {
    if (!confirm('Excluir este problema?')) return
    await supabase.from('issues').delete().eq('id', id)
    loadAll()
  }

  const previewScore = Number(form.gravity) * Number(form.urgency) * Number(form.tendency)
  const previewColor = getScoreColor(previewScore)

  const filtered = issues.filter((i) => {
    const q = search.toLowerCase()
    const matchSearch = i.title.toLowerCase().includes(q) || (i.description || '').toLowerCase().includes(q)
    const matchGroup = filterGroup === 'all' || i.working_group_id === filterGroup
    const matchStatus = filterStatus === 'all' || i.status === filterStatus
    return matchSearch && matchGroup && matchStatus
  })

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <AlertTriangle className="w-7 h-7 text-orange-500" />
            Matriz GUT
          </h1>
          <p className="text-gray-500 text-sm mt-1">Priorize problemas por Gravidade × Urgência × Tendência</p>
        </div>
        <Button onClick={openNew}>
          <Plus className="w-4 h-4" /> Novo Problema
        </Button>
      </div>

      {/* Legenda GUT */}
      <div className="flex flex-wrap gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200 text-xs text-gray-600">
        <div className="flex items-center gap-1.5 font-medium text-gray-700">
          <Info className="w-3.5 h-3.5" /> Score = G × U × T (máx. 125):
        </div>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span> ≥75 Crítico</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-400"></span> ≥27 Alto</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-400"></span> ≥8 Médio</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-400"></span> &lt;8 Baixo</span>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Buscar por título..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select value={filterGroup} onValueChange={setFilterGroup}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Grupo de Trabalho" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os GTs</SelectItem>
            {groups.map((g) => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Nenhum problema encontrado</p>
          <p className="text-sm mt-1">Cadastre problemas para priorizar com a Matriz GUT.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((issue, idx) => {
            const c = getScoreColor(issue.score)
            const pct = Math.min((issue.score / 125) * 100, 100)
            return (
              <Card key={issue.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    {/* Ranking */}
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-500">
                      {idx + 1}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900">{issue.title}</h3>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold border ${c.bg} ${c.text} ${c.border}`}>
                              <Flame className="w-3 h-3 mr-1" /> Score: {issue.score} — {c.label}
                            </span>
                            {issue.status !== 'Aberto' && (
                              <Badge variant={issue.status === 'Resolvido' ? 'success' : 'secondary'}>
                                {issue.status}
                              </Badge>
                            )}
                          </div>
                          {issue.working_groups?.name && (
                            <p className="text-xs text-blue-500 mb-1">{issue.working_groups.name}</p>
                          )}
                          {issue.description && (
                            <p className="text-sm text-gray-600 line-clamp-2">{issue.description}</p>
                          )}
                        </div>

                        <div className="flex gap-1 flex-shrink-0">
                          <button onClick={() => openEdit(issue)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => remove(issue.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Score bar */}
                      <div className="mt-3">
                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                          <div className={`h-1.5 rounded-full ${c.bar}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>

                      {/* G U T detalhes */}
                      <div className="flex gap-4 mt-2 text-xs text-gray-500">
                        <span><strong className="text-gray-700">G</strong> (Gravidade): {issue.gravity}/5</span>
                        <span><strong className="text-gray-700">U</strong> (Urgência): {issue.urgency}/5</span>
                        <span><strong className="text-gray-700">T</strong> (Tendência): {issue.tendency}/5</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Problema' : 'Novo Problema'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Título *</Label>
              <Input
                placeholder="Ex: Falta de documentação do protocolo CIBA"
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Grupo de Trabalho *</Label>
              <Select value={form.working_group_id} onValueChange={(v) => setForm((p) => ({ ...p, working_group_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecionar GT" /></SelectTrigger>
                <SelectContent>
                  {groups.map((g) => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                placeholder="Detalhes do problema..."
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                rows={3}
              />
            </div>

            {/* GUT Sliders */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { key: 'gravity', label: 'Gravidade (G)', labels: GUT_LABELS },
                { key: 'urgency', label: 'Urgência (U)', labels: URGENCY_LABELS },
                { key: 'tendency', label: 'Tendência (T)', labels: TENDENCY_LABELS },
              ].map(({ key, label, labels }) => (
                <div key={key} className="space-y-2">
                  <Label className="text-xs">{label}</Label>
                  <Select value={form[key]} onValueChange={(v) => setForm((p) => ({ ...p, [key]: v }))}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <SelectItem key={n} value={String(n)} className="text-xs">{labels[n]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>

            {/* Preview score */}
            <div className={`flex items-center justify-between p-3 rounded-lg border ${previewColor.border} ${previewColor.bg}`}>
              <span className={`text-sm font-medium ${previewColor.text}`}>
                Score GUT Preview:
              </span>
              <span className={`text-xl font-bold ${previewColor.text}`}>
                {previewScore} <span className="text-sm font-normal">— {previewColor.label}</span>
              </span>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm((p) => ({ ...p, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={save} disabled={saving || !form.title.trim() || !form.working_group_id}>
              {saving ? 'Salvando...' : editing ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
