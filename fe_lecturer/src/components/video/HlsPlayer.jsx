import { useEffect, useRef } from 'react'
import Hls from 'hls.js'

// Reproductor HLS para playlists .m3u8 servidos por la API (bucket privado).
// Añade el Bearer token a cada request (playlist + segmentos .ts) vía xhrSetup.
export default function HlsPlayer({ src, poster, className = '' }) {
  const videoRef = useRef(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video || !src) return

    const token = localStorage.getItem('accessToken')
    const withAuth = (xhr) => { if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`) }

    let hls
    // Safari reproduce HLS nativo, pero no podemos añadir headers → usamos hls.js si está soportado.
    if (Hls.isSupported()) {
      hls = new Hls({ xhrSetup: withAuth, enableWorker: true })
      hls.loadSource(src)
      hls.attachMedia(video)
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src
    }

    return () => { if (hls) hls.destroy() }
  }, [src])

  return (
    <video
      ref={videoRef}
      controls
      poster={poster}
      className={`w-full rounded-lg bg-black ${className}`}
    />
  )
}
