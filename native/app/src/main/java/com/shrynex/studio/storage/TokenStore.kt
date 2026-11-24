package com.shrynex.studio.storage

import android.content.Context
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey

class TokenStore(context: Context) {
    private val prefs = EncryptedSharedPreferences.create(
        context,
        "shryne_secure",
        MasterKey.Builder(context).setKeyScheme(MasterKey.KeyScheme.AES256_GCM).build(),
        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM,
    )

    var token: String?
        get() = prefs.getString("token", null)
        set(value) = prefs.edit().putString("token", value).apply()

    var login: String?
        get() = prefs.getString("login", null)
        set(value) = prefs.edit().putString("login", value).apply()

    var repo: String?
        get() = prefs.getString("repo", null)
        set(value) = prefs.edit().putString("repo", value).apply()

    var branch: String?
        get() = prefs.getString("branch", null)
        set(value) = prefs.edit().putString("branch", value).apply()

    var workflowHash: String?
        get() = prefs.getString("workflow_hash", null)
        set(value) = prefs.edit().putString("workflow_hash", value).apply()

    fun clear() = prefs.edit().clear().apply()
}
