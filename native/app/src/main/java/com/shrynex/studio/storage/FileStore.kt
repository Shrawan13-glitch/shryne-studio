package com.shrynex.studio.storage

import android.content.Context
import java.io.ByteArrayInputStream
import java.io.File
import java.util.UUID
import java.util.zip.ZipInputStream

class FileStore(private val context: Context) {
    private val audioDir: File
        get() = File(context.filesDir, "audio").apply { if (!exists()) mkdirs() }

    /** Unpacks every WAV in an artifact zip and returns its file URI. */
    fun unzipWavs(bytes: ByteArray, prefix: String): List<Pair<String, String>> {
        val result = mutableListOf<Pair<String, String>>()
        ZipInputStream(ByteArrayInputStream(bytes)).use { zip ->
            var entry = zip.nextEntry
            while (entry != null) {
                val name = entry.name.substringAfterLast('/')
                if (!entry.isDirectory && name.endsWith(".wav", ignoreCase = true)) {
                    val file = File(audioDir, "$prefix-${UUID.randomUUID().toString().take(8)}-$name")
                    file.outputStream().use { zip.copyTo(it) }
                    result.add(name to file.absolutePath)
                }
                zip.closeEntry()
                entry = zip.nextEntry
            }
        }
        return result
    }

    fun delete(uri: String) {
        runCatching { File(uri).delete() }
    }
}
