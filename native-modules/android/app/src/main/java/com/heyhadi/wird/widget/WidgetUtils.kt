package com.heyhadi.wird.widget

import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.net.Uri
import org.json.JSONObject

object WidgetUtils {
    const val PREFS_NAME = "wird_widget_prefs"
    const val KEY_PAYLOAD = "widget_payload"

    fun getStoredPayload(context: Context): JSONObject? {
        return try {
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val json = prefs.getString(KEY_PAYLOAD, null) ?: return null
            JSONObject(json)
        } catch (_: Exception) {
            null
        }
    }

    fun createDeepLinkIntent(context: Context, uriString: String, requestCode: Int): PendingIntent {
        val intent = Intent(Intent.ACTION_VIEW, Uri.parse(uriString)).apply {
            // Target the app's package so other apps don't intercept
            `package` = context.packageName
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
        }
        return PendingIntent.getActivity(
            context,
            requestCode,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
    }

    fun getArabicPrayerName(name: String): String {
        return when (name.lowercase().trim()) {
            "fajr", "subuh" -> "الفجر"
            "dhuhr", "dzuhur", "zuhur" -> "الظهر"
            "asr", "ashar" -> "العصر"
            "maghrib" -> "المغرب"
            "isha", "isya" -> "العشاء"
            "imsak" -> "الإمساك"
            "sunrise", "terbit", "syuruq" -> "الشروق"
            else -> ""
        }
    }

    fun getLocalizedPrayerName(name: String, language: String): String {
        val lower = name.lowercase().trim()
        return when (lower) {
            "fajr", "subuh" -> if (language == "id") "Subuh" else "Fajr"
            "dhuhr", "dzuhur", "zuhur" -> if (language == "id") "Dzuhur" else "Dhuhr"
            "asr", "ashar" -> if (language == "id") "Ashar" else "Asr"
            "maghrib" -> "Maghrib"
            "isha", "isya" -> if (language == "id") "Isya" else "Isha"
            "imsak" -> "Imsak"
            else -> name.replaceFirstChar { if (it.isLowerCase()) it.titlecase() else it.toString() }
        }
    }

    fun formatCountdown(timestamp: Long, language: String): String {
        if (timestamp <= 0) return if (language == "id") "Mendatang" else "Upcoming"
        val now = System.currentTimeMillis()
        val diffMinutes = ((timestamp - now) / 60000).toInt()
        return if (diffMinutes <= 0) {
            if (language == "id") "Waktunya salat" else "Prayer time"
        } else if (diffMinutes >= 60) {
            val hours = diffMinutes / 60
            val mins = diffMinutes % 60
            if (language == "id") "dalam ${hours}j ${mins}m" else "in ${hours}h ${mins}m"
        } else {
            if (language == "id") "dalam ${diffMinutes} mnt" else "in ${diffMinutes} min"
        }
    }
}
