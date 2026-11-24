package com.shrynex.studio.github

import java.io.IOException
import java.net.HttpURLConnection
import java.net.URL

class GithubException(val status: Int, detail: String) : Exception("GitHub $status: ${detail.take(240)}")

class GithubClient(private val token: String) {
    private fun connection(method: String, path: String, body: String?): HttpURLConnection {
        val connection = URL("https://api.github.com$path").openConnection() as HttpURLConnection
        connection.requestMethod = method
        connection.setRequestProperty("Authorization", "Bearer $token")
        connection.setRequestProperty("Accept", "application/vnd.github+json")
        connection.setRequestProperty("X-GitHub-Api-Version", "2026-03-10")
        connection.setRequestProperty("Content-Type", "application/json")
        connection.connectTimeout = 20_000
        connection.readTimeout = 30_000
        if (body != null) {
            connection.doOutput = true
            connection.outputStream.use { it.write(body.toByteArray(Charsets.UTF_8)) }
        }
        return connection
    }

    fun request(method: String, path: String, body: String? = null): String {
        val connection = connection(method, path, body)
        val code = connection.responseCode
        val stream = if (code in 200..299) connection.inputStream else connection.errorStream
        val text = stream?.bufferedReader(Charsets.UTF_8)?.use { it.readText() } ?: ""
        connection.disconnect()
        if (code !in 200..299) throw GithubException(code, text)
        return text
    }

    fun get(path: String) = request("GET", path)
    fun post(path: String, body: String? = null) = request("POST", path, body)
    fun put(path: String, body: String) = request("PUT", path, body)
    fun delete(path: String) = request("DELETE", path)

    fun downloadBytes(urlString: String): ByteArray {
        val connection = URL(urlString).openConnection() as HttpURLConnection
        connection.setRequestProperty("Authorization", "Bearer $token")
        connection.setRequestProperty("Accept", "application/octet-stream")
        connection.instanceFollowRedirects = true
        connection.connectTimeout = 20_000
        connection.readTimeout = 60_000
        val code = connection.responseCode
        if (code !in 200..299) throw IOException("Download failed ($code)")
        return connection.inputStream.use { it.readBytes() }
    }
}
