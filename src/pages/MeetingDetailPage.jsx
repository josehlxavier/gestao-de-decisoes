import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  ArrowLeft, Plus, Pencil, Trash2, BookOpen, CheckSquare, Calendar,
  User, Tag, X,
} from 'lucide-react'

function formatDate(d) {
  if (!d) return ''
  return new Date(d + 'T00:00:00').toLocaleDateString('pt-BR')
}

const TASK_STATUSES = ['Pendente', 'Em Andamento', 'Concluído']

const statusColors = {
  'Pendente': 'warning',
  'Em Andamento': 'default',
  'Concluído': 'success',
}

export default function MeetingDetailPage() {
  const { id } = useParams()
  const [meeting, setMeeting] = useState(null)
  const [decisions, setDecisions] = useState([])
  const [tasks, setTasks] = useState([])
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)

  // Decision dialog
  const [dOpen, setDOpen] = useState(false)
  const [dEditing, setDEditing] = useState(null)
  const [dForm, setDForm] = useState({ title: '', context: '', tags: '' })
  const [dSaving, setDSaving] = useState(false)

  // Task dialog
  const [tOpen, setTOpen] = useState(false)
  const [tEditing, setTEditing] = useState(null)
  const [tForm, setTForm] = useState({ title: '', description: '', status: 'Pendente', assignee_id: '', due_date: '' })
  const [tSaving, setTSaving] = useState(false)

  useEffect(() => { loadAll() }, [id])

  async function loadAll() {
    setLoading(true)
    const [m, d, t, u] = await Promise.all([
      supabase.from('meetings').select('*, working_groups(name)').eq('id', id).single(),
      supabase.from('decisions').select('*').eq('meeting_id', id).order('created_at', { ascending: false }),
      supabase.from('tasks').select('*, users(name)').eq('meeting_id', id).order('created_at', { ascending: false }),
      supabase.from('users').select('id, name').order('name'),
    ])
    setMeeting(m.data)
    setDecisions(d.data || [])
    setTasks(t.data || [])
    setMembers(u.data || [])
    setLoading(false)
  }

  // --- Decisions CRUD ---
  function openNewDecision() { setDEditing(null); setDForm({ title: '', context: '', tags: '' }); setDOpen(true) }
  function openEditDecision(d) {
    setDEditing(d)
    setDForm({ title: d.title, context: d.context || '', tags: (d.tags || []).join(', ') })
    setDOpen(true)
  }
  async function saveDecision() {
    if (!dForm.title.trim()) return
    setDSaving(true)
    const tags = dForm.tags.split(',').map((t) => t.trim()).filter(Boolean)
    const payload = { title: dForm.title, context: dForm.context, tags, meeting_id: id }
    if (dEditing) {
      await supabase.from('decisions').update(payload).eq('id', dEditing.id)
    } else {
      await supabase.from('decisions').insert(payload)
    }
    setDSaving(false)
    setDOpen(false)
    loadAll()
  }
  async function removeDecision(did) {
    if (!confirm('Excluir esta decisão?')) return
    await supabase.from('decisions').delete().eq('id', did)
    loadAll()
  }

  // --- Tasks CRUD ---
  function openNewTask() { setTEditing(null); setTForm({ title: '', description: '', status: 'Pendente', assignee_id: '', due_date: '' }); setTOpen(true) }
  function openEditTask(t) {
    setTEditing(t)
    setTForm({
      title: t.title, description: t.description || '', status: t.status,
      assignee_id: t.assignee_id || '', due_date: t.due_date || '',
    })
    setTOpen(true)
  }
  async function saveTask() {
    if (!tForm.title.trim()) return
    setTSaving(true)
    const payload = {
      title: tForm.title, description: tForm.description, status: tForm.status,
      assignee_id: tForm.assignee_id || null, due_date: tForm.due_date || null,
      meeting_id: id,
    }
    if (tEditing) {
      await supabase.from('tasks').update(payload).eq('id', tEditing.id)
    } else {
      await supabase.from('tasks').insert(payload)
    }
    setTSaving(false)
    setTOpen(false)
    loadAll()
  }
  async function removeTask(tid) {
    if (!confirm('Excluir esta tarefa?')) return
    await supabase.from('tasks').delete().eq('id', tid)
    loadAll()
  }
  async function updateTaskStatus(tid, status) {
    await supabase.from('tasks').update({ status }).eq('id', tid)
    setTasks((prev) => prev.map((t) => (t.id === tid ? { ...t, status } : t)))
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!meeting) {
    return (
      <div className="text-center py-20 text-gray-400">
        <p>Ata não encontrada.</p>
        <Button variant="outline" className="mt-4" asChild>
          <Link to="/reunioes">Voltar</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link to="/reunioes" className="hover:text-blue-600 flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Atas
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-medium truncate">{meeting.title}</span>
      </div>

      {/* Meeting header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{meeting.title}</h1>
              <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-500">
                {meeting.working_groups?.name && (
                  <span className="flex items-center gap-1">
                    <User className="w-4 h-4" /> {meeting.working_groups.name}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" /> {formatDate(meeting.date)}
                </span>
              </div>
            </div>
          </div>
          {meeting.summary && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-700 whitespace-pre-line">{meeting.summary}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabs: Decisions + Tasks */}
      <Tabs defaultValue="decisions">
        <TabsList>
          <TabsTrigger value="decisions">
            <BookOpen className="w-4 h-4 mr-1.5" />
            Decisões ({decisions.length})
          </TabsTrigger>
          <TabsTrigger value="tasks">
            <CheckSquare className="w-4 h-4 mr-1.5" />
            Planos de Ação ({tasks.length})
          </TabsTrigger>
        </TabsList>

        {/* DECISIONS TAB */}
        <TabsContent value="decisions" className="mt-4 space-y-4">
          <div className="flex justify-end">
            <Button size="sm" onClick={openNewDecision}>
              <Plus className="w-4 h-4" /> Nova Decisão
            </Button>
          </div>

          {decisions.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>Nenhuma decisão registrada ainda.</p>
            </div>
          ) : (
            decisions.map((d) => (
              <Card key={d.id}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900">{d.title}</h3>
                      {d.context && (
                        <p className="text-sm text-gray-600 mt-2 whitespace-pre-line">{d.context}</p>
                      )}
                      {d.tags?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {d.tags.map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-medium"
                            >
                              <Tag className="w-3 h-3" /> {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button onClick={() => openEditDecision(d)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => removeDecision(d.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* TASKS TAB */}
        <TabsContent value="tasks" className="mt-4 space-y-4">
          <div className="flex justify-end">
            <Button size="sm" onClick={openNewTask}>
              <Plus className="w-4 h-4" /> Nova Tarefa
            </Button>
          </div>

          {tasks.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <CheckSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>Nenhuma tarefa ainda.</p>
            </div>
          ) : (
            tasks.map((t) => (
              <Card key={t.id}>
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">{t.title}</h3>
                        <Badge variant={statusColors[t.status] || 'secondary'}>{t.status}</Badge>
                      </div>
                      {t.description && <p className="text-sm text-gray-600 mt-1">{t.description}</p>}
                      <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-400">
                        {t.users?.name && (
                          <span className="flex items-center gap-1">
                            <User className="w-3.5 h-3.5" /> {t.users.name}
                          </span>
                        )}
                        {t.due_date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" /> {formatDate(t.due_date)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Select value={t.status} onValueChange={(v) => updateTaskStatus(t.id, v)}>
                        <SelectTrigger className="w-36 h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TASK_STATUSES.map((s) => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <button onClick={() => openEditTask(t)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => removeTask(t.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Decision Dialog */}
      <Dialog open={dOpen} onOpenChange={setDOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{dEditing ? 'Editar Decisão' : 'Nova Decisão'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Título da Decisão *</Label>
              <Input
                placeholder="Ex: Adotar CIBA como protocolo de autenticação"
                value={dForm.title}
                onChange={(e) => setDForm((p) => ({ ...p, title: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Contexto / Racional</Label>
              <Textarea
                placeholder="Descreva o motivo desta decisão, alternativas consideradas e impacto esperado..."
                value={dForm.context}
                onChange={(e) => setDForm((p) => ({ ...p, context: e.target.value }))}
                rows={5}
              />
            </div>
            <div className="space-y-2">
              <Label>Tags (separadas por vírgula)</Label>
              <Input
                placeholder="Ex: CIBA, segurança, ITP, Open Finance"
                value={dForm.tags}
                onChange={(e) => setDForm((p) => ({ ...p, tags: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDOpen(false)}>Cancelar</Button>
            <Button onClick={saveDecision} disabled={dSaving || !dForm.title.trim()}>
              {dSaving ? 'Salvando...' : dEditing ? 'Salvar' : 'Registrar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Task Dialog */}
      <Dialog open={tOpen} onOpenChange={setTOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{tEditing ? 'Editar Tarefa' : 'Nova Tarefa'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Título da Tarefa *</Label>
              <Input
                placeholder="Ex: Documentar fluxo de autenticação CIBA"
                value={tForm.title}
                onChange={(e) => setTForm((p) => ({ ...p, title: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                placeholder="Detalhes da tarefa..."
                value={tForm.description}
                onChange={(e) => setTForm((p) => ({ ...p, description: e.target.value }))}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={tForm.status} onValueChange={(v) => setTForm((p) => ({ ...p, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TASK_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Prazo</Label>
                <Input
                  type="date"
                  value={tForm.due_date}
                  onChange={(e) => setTForm((p) => ({ ...p, due_date: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Responsável</Label>
              <Select value={tForm.assignee_id} onValueChange={(v) => setTForm((p) => ({ ...p, assignee_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecionar membro" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Sem responsável</SelectItem>
                  {members.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setTOpen(false)}>Cancelar</Button>
            <Button onClick={saveTask} disabled={tSaving || !tForm.title.trim()}>
              {tSaving ? 'Salvando...' : tEditing ? 'Salvar' : 'Criar tarefa'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
