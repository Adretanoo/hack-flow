import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useQueryClient, useMutation, useQuery } from '@tanstack/react-query'
import { Plus, Trash2, ExternalLink, Link as LinkIcon, Lock } from 'lucide-react'
import { projectsApi } from '@/api/projects'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import type { Hackathon, Team } from '@/types/api.types'

interface ProjectTabProps {
  hackathon: Hackathon
  myTeam?: Team
  stageInfo: ReturnType<typeof import('@/hooks/useHackathonStage').useHackathonStage>
}

export function ProjectTab({ myTeam, stageInfo }: ProjectTabProps) {
  const queryClient = useQueryClient()
  const { register, handleSubmit, reset } = useForm()
  const { register: registerRes, handleSubmit: handleResSubmit, reset: resetRes } = useForm()

  const { data: projData, isLoading } = useQuery({
    queryKey: ['team-project', myTeam?.id],
    queryFn: () => projectsApi.list({ teamId: myTeam?.id }).then(res => res.data.data[0]),
    enabled: !!myTeam?.id,
  })

  // Hack for getting full project including resources
  const { data: projectDetails } = useQuery({
    queryKey: ['project-details', projData?.id],
    queryFn: () => projectsApi.getById(projData!.id).then(res => res.data.data),
    enabled: !!projData?.id,
  })

  // Let's use projectDetails if available, fallback to projData
  const project = projectDetails || projData

  const { data: resTypesData } = useQuery({
    queryKey: ['project-resource-types'],
    queryFn: () => projectsApi.getResourceTypes().then(res => res.data.data),
  })

  const resourceTypes = resTypesData || [
    { id: '1', name: 'GitHub Repo' },
    { id: '2', name: 'Demo URL' },
    { id: '3', name: 'Presentation' }
  ] // Mock if API doesn't exist

  useEffect(() => {
    if (project) {
      reset({ title: project.title, description: (project as any).description })
    }
  }, [project, reset])

  const createMut = useMutation({
    mutationFn: (data: any) => projectsApi.create({ ...data, teamId: myTeam!.id, stageId: stageInfo.activeStage?.id || '' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['team-project'] })
  })

  const updateMut = useMutation({
    mutationFn: (data: any) => projectsApi.update(project!.id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['project-details'] })
  })

  const submitMut = useMutation({
    mutationFn: () => projectsApi.submit(project!.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['project-details'] })
  })

  const addResourceMut = useMutation({
    mutationFn: (data: any) => projectsApi.addResource(project!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-details'] })
      resetRes()
    }
  })

  const removeResourceMut = useMutation({
    mutationFn: (resId: string) => projectsApi.removeResource(project!.id, resId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['project-details'] })
  })

  if (!myTeam) {
    return <div className="py-24 text-center">Спершу створіть або приєднайтесь до команди</div>
  }

  if (isLoading) return <div className="py-24"><LoadingSpinner /></div>

  if (!project) {
    return (
      <div className="mt-8 rounded-xl border border-dashed border-border bg-card p-12 text-center">
        <h3 className="text-xl font-semibold mb-2">Проєкт ще не створено</h3>
        <p className="text-muted-foreground max-w-md mx-auto mb-6">
          Створіть чернетку проєкту, щоб почати працювати над ним разом з командою.
        </p>
        {!stageInfo.canSubmit ? (
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-muted rounded-md text-sm font-medium">
            <Lock className="h-4 w-4" /> Доступно під час етапу розробки
          </div>
        ) : (
          <button 
            onClick={() => createMut.mutate({ title: `${myTeam.name} Project` })}
            className="rounded-md bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Створити проєкт
          </button>
        )}
      </div>
    )
  }

  const isEditable = project.status === 'DRAFT' && stageInfo.canSubmit
  const hasGitResource = project.resources?.some((r: any) => /github|gitlab|bitbucket/i.test(r.url))

  return (
    <div className="mt-6 space-y-6">
      {/* Banner */}
      <div className={`rounded-lg p-4 flex items-center justify-between ${
        project.status === 'DRAFT' ? 'bg-amber-100 text-amber-800' :
        project.status === 'SUBMITTED' ? 'bg-blue-100 text-blue-800' :
        project.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
        project.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
        'bg-purple-100 text-purple-800'
      }`}>
        <div>
          <h4 className="font-semibold">
            {project.status === 'DRAFT' ? 'Чернетка' :
             project.status === 'SUBMITTED' ? 'На розгляді' :
             project.status === 'APPROVED' ? 'Схвалено' :
             project.status === 'REJECTED' ? 'Відхилено' : 'Переглянуто'}
          </h4>
          <p className="text-sm mt-1 opacity-90">
            {project.status === 'DRAFT' ? 'Подайте проєкт до кінця етапу розробки.' :
             project.status === 'REJECTED' ? project.comment || 'Оновіть проєкт та подайте знову.' :
             'Проєкт подано на оцінювання.'}
          </p>
        </div>
        {project.status === 'DRAFT' && stageInfo.canSubmit && (
          <div className="flex flex-col items-end gap-2 shrink-0">
            <button 
              onClick={() => {
                if (confirm('Після подачі редагування буде недоступне. Продовжити?')) {
                  submitMut.mutate()
                }
              }}
              disabled={submitMut.isPending || !hasGitResource}
              className="rounded-md bg-black/10 px-4 py-2 text-sm font-medium hover:bg-black/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitMut.isPending ? 'Зачекайте...' : 'Подати на розгляд'}
            </button>
            {!hasGitResource && (
              <span className="text-xs text-red-600 font-medium max-w-[200px] text-right">
                Додайте посилання на Git (GitHub, GitLab), щоб подати проєкт
              </span>
            )}
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 border-b border-border pb-2">Основна інформація</h3>
          <form onSubmit={handleSubmit((d) => updateMut.mutate(d))} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Назва проєкту</label>
              <input 
                {...register('title')} 
                disabled={!isEditable}
                className="w-full rounded-md border border-border px-3 py-2 text-sm bg-background disabled:bg-muted disabled:text-muted-foreground" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Опис</label>
              <textarea 
                {...register('description')} 
                disabled={!isEditable}
                rows={5}
                className="w-full rounded-md border border-border px-3 py-2 text-sm bg-background resize-none disabled:bg-muted disabled:text-muted-foreground" 
              />
            </div>
            {isEditable && (
              <div className="flex justify-end pt-2">
                <button type="submit" disabled={updateMut.isPending} className="rounded-md bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground hover:bg-secondary/80">
                  {updateMut.isPending ? 'Збереження...' : 'Зберегти зміни'}
                </button>
              </div>
            )}
          </form>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 border-b border-border pb-2">Ресурси</h3>
          
          <div className="space-y-3 mb-6">
            {(!project.resources || project.resources.length === 0) && (
              <p className="text-sm text-muted-foreground text-center py-4">Додані ресурси відсутні</p>
            )}
            {project.resources?.map((res: any) => (
              <div key={res.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/20">
                <div className="flex items-center gap-3 overflow-hidden">
                  <LinkIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="overflow-hidden">
                    <p className="text-sm font-medium truncate">{res.description || res.type}</p>
                    <a href={res.url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1 truncate">
                      {res.url} <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
                {isEditable && (
                  <button 
                    onClick={() => removeResourceMut.mutate(res.id)}
                    className="p-1.5 text-muted-foreground hover:text-destructive rounded-md ml-2 shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {isEditable && (
            <form onSubmit={handleResSubmit((d) => addResourceMut.mutate(d))} className="space-y-3 border-t border-border pt-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <select {...registerRes('projectTypeId', { required: true })} className="w-full rounded-md border border-border px-3 py-2 text-sm bg-background">
                  <option value="">Оберіть тип...</option>
                  {resourceTypes.map((t: any) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
                <input {...registerRes('description')} placeholder="Короткий опис" className="w-full rounded-md border border-border px-3 py-2 text-sm bg-background" />
              </div>
              <div className="flex gap-2">
                <input {...registerRes('url', { required: true })} placeholder="https://..." className="flex-1 rounded-md border border-border px-3 py-2 text-sm bg-background" />
                <button type="submit" disabled={addResourceMut.isPending} className="shrink-0 rounded-md bg-secondary px-3 py-2 text-sm font-medium text-secondary-foreground">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
