import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { CheckSquare, Calendar, User, FileText, ArrowRight } from 'lucide-react'

function formatDate(d) {
  if (!d) return null
  return new Date(d + 'T00:00:00').toLocaleDateString('pt-BR')
}

function isOverdue(dueDate, status) {
  if (!dueDate || status === 'Concluído') return false
  return new Date(dueDate) < new Date()
}

const statusVariant = {
  'Pendente': 'warning',
  'Em Andamento': 'default',
  'Concluído': 'success',
}

export default function TasksPage() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  async function load() {
    const { data } = await supabase
      .from('tasks')
      .select('*, users(name), meetings(title, id, working_groups(name))')
      .order('due_date', { ascending: true, nullsFirst: false })
    setTasks(data || [])
    setLoading(false)
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load() }, [])


  async function updateStatus(id, status) {
    await supabase.from('tasks').update({ status }).eq('id', id)
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)))
  }

  const filtered = tasks.filter((t) => {
    const q = search.toLowerCase()
    const matchSearch =
      t.title.toLowerCase().includes(q) ||
      (t.description || '').toLowerCase().includes(q) ||
      (t.users?.name || '').toLowerCase().includes(q) ||
      (t.meetings?.title || '').toLowerCase().includes(q)
    const matchStatus = filterStatus === 'all' || t.status === filterStatus
    return matchSearch && matchStatus
  })

  const counts = {
    all: tasks.length,
    Pendente: tasks.filter((t) => t.status === 'Pendente').length,
    'Em Andamento': tasks.filter((t) => t.status === 'Em Andamento').length,
    Concluído: tasks.filter((t) => t.status === 'Concluído').length,
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <CheckSquare className="w-7 h-7 text-blue-600" />
          Planos de Ação
        </h1>
        <p className="text-gray-500 text-sm mt-1">Todas as tarefas geradas a partir das reuniões</p>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Buscar por título, responsável ou ata..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos ({counts.all})</SelectItem>
            <SelectItem value="Pendente">Pendente ({counts.Pendente})</SelectItem>
            <SelectItem value="Em Andamento">Em Andamento ({counts['Em Andamento']})</SelectItem>
            <SelectItem value="Concluído">Concluído ({counts.Concluído})</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <CheckSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Nenhuma tarefa encontrada</p>
          <p className="text-sm mt-1">Crie tarefas dentro de uma ata de reunião.</p>
          <Button variant="outline" size="sm" className="mt-4" asChild>
            <Link to="/reunioes">Ir para Atas</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((t) => {
            const overdue = isOverdue(t.due_date, t.status)
            return (
              <Card key={t.id} className={`hover:shadow-md transition-shadow ${overdue ? 'border-red-200' : ''}`}>
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">{t.title}</h3>
                        <Badge variant={statusVariant[t.status] || 'secondary'}>{t.status}</Badge>
                        {overdue && <Badge variant="destructive">Atrasada</Badge>}
                      </div>
                      {t.description && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{t.description}</p>
                      )}
                      <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-400">
                        {t.users?.name && (
                          <span className="flex items-center gap-1">
                            <User className="w-3.5 h-3.5" /> {t.users.name}
                          </span>
                        )}
                        {t.due_date && (
                          <span className={`flex items-center gap-1 ${overdue ? 'text-red-500 font-medium' : ''}`}>
                            <Calendar className="w-3.5 h-3.5" />
                            {overdue ? 'Prazo: ' : ''}{formatDate(t.due_date)}
                          </span>
                        )}
                        {t.meetings && (
                          <span className="flex items-center gap-1">
                            <FileText className="w-3.5 h-3.5" />
                            {t.meetings.title}
                            {t.meetings.working_groups?.name && (
                              <span className="text-blue-500">· {t.meetings.working_groups.name}</span>
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Select value={t.status} onValueChange={(v) => updateStatus(t.id, v)}>
                        <SelectTrigger className="w-36 h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Pendente">Pendente</SelectItem>
                          <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                          <SelectItem value="Concluído">Concluído</SelectItem>
                        </SelectContent>
                      </Select>
                      {t.meetings && (
                        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                          <Link to={`/reunioes/${t.meetings.id}`} title="Ver ata">
                            <ArrowRight className="w-4 h-4" />
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
