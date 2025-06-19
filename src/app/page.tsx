"use client"

import { useState, useEffect, useRef } from "react"
import { Search, Play, ArrowLeft, Clock, MapPin, AlertTriangle,
  Users, Download, Share2, Upload, FileVideo, CheckCircle, } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import dynamic from "next/dynamic"

// Importar ReactPlayer dinámicamente para evitar problemas de SSR
const ReactPlayer = dynamic(() => import("react-player"), { ssr: false })

// Datos simulados
const mockVideoData = [
  {
    camera_id: "cam_02",
    location: "Pasillo Edificio B",
    priority: "media",
    video_file: "VIRAT_S_000002.mp4",
    date: "2024-04-13",
    timeslots: [
      {
        hour: "08:00-09:00",
        object_counts: { person: 30, backpack: 18 },
      },
      {
        hour: "09:00-10:00",
        object_counts: { person: 25, backpack: 12 },
      },
    ],
    alerts: [
      {
        type: "presencia_fuera_de_horario",
        timestamp: "2024-04-13T22:34:00",
        details: { zone: "Pasillo B", person_id: "desconocido" },
      },
    ],
  },
  {
    camera_id: "cam_05",
    location: "Entrada Principal",
    priority: "alta",
    video_file: "VIRAT_S_000200_00_000100_000171.mp4",
    date: "2024-04-13",
    timeslots: [
      {
        hour: "07:00-08:00",
        object_counts: { person: 45, vehicle: 8, backpack: 22 },
      },
      {
        hour: "08:00-09:00",
        object_counts: { person: 67, vehicle: 12, backpack: 35 },
      },
    ],
    alerts: [
      {
        type: "objeto_abandonado",
        timestamp: "2024-04-13T14:22:00",
        details: { zone: "Entrada", object_type: "backpack", duration: "15min" },
      },
      {
        type: "acceso_no_autorizado",
        timestamp: "2024-04-13T19:45:00",
        details: { zone: "Entrada", person_id: "desconocido" },
      },
    ],
  },
  {
    camera_id: "cam_01",
    location: "Estacionamiento Norte",
    priority: "baja",
    video_file: "VIRAT_S_000200_00_000100_000171_h264.mp4",
    date: "2024-04-13",
    timeslots: [
      {
        hour: "06:00-07:00",
        object_counts: { vehicle: 15, person: 8 },
      },
    ],
    alerts: [],
  },
]

export default function VideoSearchEngine() {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState([])
  const [selectedVideo, setSelectedVideo] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isVideoLoading, setIsVideoLoading] = useState(false)
  const [videoError, setVideoError] = useState(false)

  // Estados para la subida de archivos
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadedFile, setUploadedFile] = useState(null)
  const [uploadComplete, setUploadComplete] = useState(false)
  const fileInputRef = useRef(null)

  // Simular busqueda con delay
  useEffect(() => {
    const fetchResults = async () => {
      if (searchQuery.trim() === "") {
        setSearchResults([])
        return
      }

      setIsLoading(true)
      try {
        const response = await fetch(`http://localhost:5000/search?q=${encodeURIComponent(searchQuery)}`)
        const data = await response.json()
        setSearchResults(data)
      } catch (error) {
        console.error("Error al buscar videos:", error)
        setSearchResults([])
      }
      setIsLoading(false)
    }

    const timer = setTimeout(fetchResults, 500)

    return () => clearTimeout(timer)
  }, [searchQuery])

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "alta":
        return "bg-red-100 text-red-800 border-red-200"
      case "media":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "baja":
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getTotalObjectCount = (timeslots: any) => {
    return timeslots.reduce((total, slot) => {
      return total + Object.values(slot.object_counts).reduce((sum, count) => (sum as number) + (count as number), 0)
    }, 0)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const handleVideoReady = () => {
    console.log("Video listo para reproducirse")
    setIsVideoLoading(false)
    setVideoError(false)
  }

  const handleVideoError = () => {
    console.log("Error al cargar el video")
    setIsVideoLoading(false)
    setVideoError(true)
  }

  const handleVideoBuffer = () => {
    console.log("Video buffering")
    setIsVideoLoading(true)
  }

  const handleVideoBufferEnd = () => {
    console.log("Video buffer end")
    setIsVideoLoading(false)
  }

  const handleVideoPlay = () => {
    console.log("Video reproduciendo")
    setIsVideoLoading(false)
  }

  // Ya no necesitamos establecer isVideoLoading a true en handleVideoStart
  const handleVideoStart = () => {
    console.log("Video iniciado")
  }

  const handleVideoSelect = async (videoFile: string) => {
    setIsVideoLoading(true)
    setVideoError(false)
    try {
      const response = await fetch(`http://localhost:5000/metadata/${videoFile}`)
      if (!response.ok) throw new Error("Error al cargar metadata")
      const metadata = await response.json()
      setSelectedVideo(metadata)
    } catch (error) {
      console.error("Error al cargar metadata del video:", error)
      setVideoError(true)
    }
    setIsVideoLoading(false)
  }

  // Funciones para la subida de archivos
  const handleFileSelect = (files) => {
    const file = files[0]
    if (file && file.type === "video/mp4") {
      if (!isUploading && !uploadComplete) {
        setUploadedFile(file)
        simulateUpload(file)
      }
    } else {
      alert("Por favor selecciona un archivo MP4 válido")
    }
  }

  const simulateUpload = (file) => {
    setIsUploading(true)
    setUploadProgress(0)
    setUploadComplete(false)

    // Simular progreso de subida
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setIsUploading(false)
          setUploadComplete(true)

          // Agregar el video subido a los resultados
          const newVideo = {
            camera_id: `upload_${Date.now()}`,
            location: "Video Subido",
            priority: "media",
            video_file: file.name,
            video_url: URL.createObjectURL(file),
            date: new Date().toISOString().split("T")[0],
            timeslots: [
              {
                hour: "Pendiente análisis",
                object_counts: { pending: 0 },
              },
            ],
            alerts: [],
          }

          setSearchResults((prev) => {
            const alreadyExists = prev.some(v => v.video_file === file.name)
            if (!alreadyExists) {
              return [newVideo, ...prev]
            }
            return prev
          })

          // Cerrar modal despues de 2 segundos
          setTimeout(() => {
            resetUploadState()
            setIsUploadModalOpen(false)
          }, 2000)

          return 100
        }
        return prev + Math.random() * 15
      })
    }, 200)
  }

  const resetUploadState = () => {
    setUploadProgress(0)
    setIsUploading(false)
    setUploadedFile(null)
    setUploadComplete(false)
    setIsDragOver(false)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragOver(false)
    const files = Array.from(e.dataTransfer.files)
    handleFileSelect(files)
  }

  if (selectedVideo) {
    return (
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-6xl mx-auto p-6">
            {/* Header con botón de volver */}
            <div className="mb-6">
              <Button
                  variant="ghost"
                  onClick={() => setSelectedVideo(null)}
                  className="mb-4 text-slate-600 hover:text-slate-900"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver a resultados
              </Button>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              {/* Reproductor de video */}
              <div className="lg:col-span-2">
                <Card className="shadow-lg border-0">
                  <CardContent className="p-0">
                    <div className="aspect-video bg-slate-900 rounded-t-lg relative overflow-hidden">
                      {isVideoLoading && (
                          <div className="absolute inset-0 flex items-center justify-center bg-slate-900 z-10">
                            <div className="text-center text-white">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                              <p>Cargando video...</p>
                            </div>
                          </div>
                      )}

                      {videoError ? (
                          <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
                            <div className="text-center text-white">
                              <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-red-400" />
                              <p className="text-lg font-medium mb-2">Error al cargar el video</p>
                              <p className="text-sm opacity-70">No se pudo reproducir el archivo de video</p>
                              <Button
                                  variant="outline"
                                  className="mt-4 text-white border-white hover:bg-white hover:text-slate-900"
                                  onClick={() => {
                                    setVideoError(false)
                                    setIsVideoLoading(true)
                                  }}
                              >
                                Reintentar
                              </Button>
                            </div>
                          </div>
                      ) : (
                          <ReactPlayer
                              url={`http://localhost:5000/video/${selectedVideo.video_file}`}
                              width="100%"
                              height="100%"
                              controls={true}
                              onReady={handleVideoReady}
                              onError={handleVideoError}
                              onStart={handleVideoStart}
                              onPlay={handleVideoPlay}
                              onBuffer={handleVideoBuffer}
                              onBufferEnd={handleVideoBufferEnd}
                              config={{
                                file: {
                                  attributes: {
                                    controlsList: "nodownload",
                                    disablePictureInPicture: false,
                                  },
                                },
                              }}
                          />
                      )}
                    </div>

                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h1 className="text-2xl font-bold text-slate-900 mb-2">
                            {selectedVideo.camera_id.toUpperCase()}
                          </h1>
                          <div className="flex items-center gap-4 text-slate-600 mb-4">
                            <div className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              <span>{selectedVideo.location}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              <span>{formatDate(selectedVideo.date)}</span>
                            </div>
                          </div>
                          <Badge className={getPriorityColor(selectedVideo.priority)}>
                            Prioridad {selectedVideo.priority}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Metadata y alertas */}
              <div className="space-y-6">
                {/* Estadísticas */}
                <Card className="shadow-lg border-0">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-slate-900">
                      <Users className="w-5 h-5" />
                      Estadísticas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-slate-600 mb-2">Total de objetos detectados</p>
                        <p className="text-2xl font-bold text-slate-900">
                          {getTotalObjectCount(selectedVideo.timeslots)}
                        </p>
                      </div>
                      <Separator />
                      <div>
                        <p className="text-sm text-slate-600 mb-3">Detecciones por franja horaria</p>
                        <div className="space-y-2">
                          {selectedVideo.timeslots.map((slot, index) => (
                              <div key={index} className="bg-slate-50 p-3 rounded-lg">
                                <p className="font-medium text-slate-900 mb-1">{slot.hour}</p>
                                <div className="flex flex-wrap gap-2">
                                  {Object.entries(slot.object_counts).map(([object, count]) => (
                                      <Badge key={object} variant="secondary" className="text-xs">
                                        {object}: {count as string}
                                      </Badge>
                                  ))}
                                </div>
                              </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Alertas */}
                <Card className="shadow-lg border-0">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-slate-900">
                      <AlertTriangle className="w-5 h-5" />
                      Alertas ({selectedVideo.alerts.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedVideo.alerts.length > 0 ? (
                        <div className="space-y-3">
                          {selectedVideo.alerts.map((alert, index) => (
                              <div key={index} className="border-l-4 border-red-400 bg-red-50 p-4 rounded-r-lg">
                                <div className="flex justify-between items-start mb-2">
                                  <h4 className="font-medium text-red-900 capitalize">{alert.event_type.replace(/_/g, " ")}</h4>
                                  <span className="text-xs text-red-600">{formatTimestamp(alert.timestamp)}</span>
                                </div>
                                <div className="text-sm text-red-700">
                                  {alert.details && Object.entries(alert.details).map(([key, value]) => (
                                      <p key={key}>
                                        <span className="capitalize">{key.replace(/_/g, " ")}: </span>
                                        {value as string}
                                      </p>
                                  ))}
                                </div>
                              </div>
                          ))}
                        </div>
                    ) : (
                        <p className="text-slate-500 text-center py-4">No hay alertas registradas</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
    )
  }

  return (
      <div className="min-h-screen bg-white">
        {/* Header */}
        <div className="border-b border-gray-100">
          <div className="max-w-4xl mx-auto px-6 py-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Motor de Búsqueda de Videos</h1>
              <p className="text-slate-600">Sistema basado en Hadoop para análisis de video</p>
            </div>

            <div className="max-w-2xl mx-auto space-y-4">
              {/* Barra de búsqueda */}
              <div className="relative max-w-2xl mx-auto">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <Input
                      type="text"
                      placeholder="Buscar por objetos en video..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-12 pr-4 py-4 text-lg border-2 border-slate-200 rounded-full focus:border-slate-400 focus:ring-0 shadow-lg"
                  />
                </div>
              </div>

              {/*TODO: Incluir subir video aqui*/}

            </div>
          </div>
        </div>

        {/* Resultados */}
        <div className="max-w-4xl mx-auto px-6 py-8">
          {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600"></div>
                <span className="ml-3 text-slate-600">Buscando videos...</span>
              </div>
          ) : (
              <>
                <div className="mb-6">
                  <p className="text-slate-600">
                    {searchResults.length} resultado{searchResults.length !== 1 ? "s" : ""} encontrado
                    {searchResults.length !== 1 ? "s" : ""}
                    {searchQuery && ` para "${searchQuery}"`}
                  </p>
                </div>

                <div className="space-y-4">
                  {searchResults.map((video, index) => (
                      <Card
                          key={index}
                          className="hover:shadow-lg transition-all duration-200 cursor-pointer border-0 shadow-md"
                          onClick={() => {
                              // handleVideoSelect(video);
                              setSelectedVideo(video);
                            }
                          }
                      >
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-xl font-semibold text-slate-900 hover:text-slate-700">
                                  {video.camera_id.toUpperCase()}
                                </h3>
                                <Badge className={getPriorityColor(video.priority)}>{video.priority}</Badge>
                              </div>

                              <div className="flex items-center gap-4 text-slate-600 mb-3">
                                <div className="flex items-center gap-1">
                                  <MapPin className="w-4 h-4" />
                                  <span>{video.location}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  <span>{formatDate(video.date)}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Users className="w-4 h-4" />
                                  <span>{getTotalObjectCount(video.timeslots)} objetos detectados</span>
                                </div>
                              </div>

                              <p className="text-slate-700 mb-3">
                                Archivo:{" "}
                                <span className="font-mono text-sm bg-slate-100 px-2 py-1 rounded">{video.video_file}</span>
                              </p>

                              {video.alerts.length > 0 && (
                                  <div className="flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4 text-red-500" />
                                    <span className="text-red-600 text-sm font-medium">
                              {video.alerts.length} alerta{video.alerts.length !== 1 ? "s" : ""} registrada
                                      {video.alerts.length !== 1 ? "s" : ""}
                            </span>
                                  </div>
                              )}
                            </div>

                            <div className="ml-4">
                              <div className="w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center">
                                <Play className="w-6 h-6 text-slate-600" />
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                  ))}
                </div>

                {searchResults.length === 0 && (
                    <div className="text-center py-12">
                      <Search className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-slate-900 mb-2">No se encontraron resultados</h3>
                      <p className="text-slate-600">Intenta con otros términos de búsqueda</p>
                    </div>
                )}
              </>
          )}
        </div>
      </div>
  )
}
