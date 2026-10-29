import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { server } from '@/api/mocks/server'
import { resetData } from '@/api/mocks/data/reset'
import { resetSimulasi } from '@/api/mocks/handlers/simulasi'

/* Unggahan `multipart/form-data` butuh penyesuaian realm di lingkungan uji.
   `fetch` di sini adalah fetch Node (undici), sedangkan `Blob`/`File`/`FormData`
   datang dari jsdom — kelas yang berbeda. Undici menolak berkas asing saat
   menyusun badan multipart (permintaan putus di tengah), dan saat membaca badan
   multipart ia membuat `File` dari kelas global lalu membandingkannya dengan
   kelas Node miliknya. Karena itu badan FormData disalin ke kelas Node lebih
   dulu, dan selama permintaan berlangsung `File`/`Blob` global ditukar ke kelas
   Node — persis seperti yang dilakukan tes handler secara manual. Nama dan tipe
   berkas ikut tersalin, jadi handler melihat `proof` yang sama seperti di
   peramban. Tanpa ini, unggahan lewat formulir hanya bisa diuji sebagai badan
   multipart buatan tangan, bukan lewat input berkas sungguhan. */
const modulBuffer = 'node:buffer'

type KelasBuffer = { File: typeof globalThis.File; Blob: typeof globalThis.Blob }

async function kelasNode() {
  return (await import(/* @vite-ignore */ modulBuffer)) as KelasBuffer
}

/* Kelas `FormData` milik fetch Node hanya bisa dijangkau lewat `Response`:
   `globalThis.FormData` sudah ditimpa jsdom. */
async function FormDataNode(): Promise<typeof globalThis.FormData> {
  const contoh = await new Response('a=1', { headers: { 'content-type': 'application/x-www-form-urlencoded' } }).formData()
  return contoh.constructor as typeof globalThis.FormData
}

async function salinKeKelasNode(badan: FormData, FileNode: typeof globalThis.File): Promise<FormData> {
  const FormDataKelas = await FormDataNode()
  const salinan = new FormDataKelas()
  for (const [nama, nilai] of badan) {
    /* `append`, bukan `set`: `set` membuang butir berama ganda, jadi
       `facilities[]` tinggal satu nilai sebelum MSW sempat membacanya. */
    if (typeof nilai === 'string') salinan.append(nama, nilai)
    else salinan.append(nama, new FileNode([await nilai.arrayBuffer()], nilai.name, { type: nilai.type }))
  }
  return salinan
}

function samakanRealmUnggahan() {
  const fetchAsli = globalThis.fetch.bind(globalThis)
  globalThis.fetch = async (input, init) => {
    if (!(init?.body instanceof FormData)) return fetchAsli(input, init)

    const { File: FileNode, Blob: BlobNode } = await kelasNode()
    const badan = await salinKeKelasNode(init.body, FileNode)
    const asli = { File: globalThis.File, Blob: globalThis.Blob }
    globalThis.File = FileNode
    globalThis.Blob = BlobNode
    try {
      return await fetchAsli(input, { ...init, body: badan })
    } finally {
      globalThis.File = asli.File
      globalThis.Blob = asli.Blob
    }
  }
}

beforeAll(() => {
  server.listen({ onUnhandledFrame: 'error' })
  samakanRealmUnggahan()
})

afterEach(() => {
  cleanup()
  localStorage.clear()
  server.resetHandlers()
  resetSimulasi()
  resetData()
})

afterAll(() => server.close())
