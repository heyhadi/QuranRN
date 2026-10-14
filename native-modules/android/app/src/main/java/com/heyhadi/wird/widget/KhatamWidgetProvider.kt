package com.heyhadi.wird.widget

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.widget.RemoteViews
import com.heyhadi.wird.R

class KhatamWidgetProvider : AppWidgetProvider() {

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        for (appWidgetId in appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId)
        }
    }

    companion object {
        fun updateAppWidget(
            context: Context,
            appWidgetManager: AppWidgetManager,
            appWidgetId: Int
        ) {
            val payload = WidgetUtils.getStoredPayload(context)
            val language = payload?.optString("language", "en") ?: "en"
            val isId = language == "id"
            val khatam = payload?.optJSONObject("khatam")

            val views = RemoteViews(context.packageName, R.layout.widget_khatam)

            if (khatam == null) {
                views.setTextViewText(R.id.khatam_streak, if (isId) "🔥 0 hari" else "🔥 0 days")
                views.setTextViewText(R.id.khatam_label, if (isId) "TARGET KHATAM" else "KHATAM GOAL")
                views.setTextViewText(R.id.khatam_pages, "0 / 4")
                views.setTextViewText(R.id.khatam_pages_label, if (isId) "halaman hari ini" else "pages read today")
                views.setProgressBar(R.id.khatam_progress_bar, 100, 0, false)
                views.setTextViewText(R.id.khatam_days_left, if (isId) "Mulai target khatam" else "Start your Khatam plan")
            } else {
                val streakDays = khatam.optInt("streakDays", 0)
                val todayPages = khatam.optInt("todayPages", 0)
                val targetPages = khatam.optInt("targetPages", 4)
                val percentComplete = khatam.optInt("percentComplete", 0)
                val daysRemaining = khatam.optInt("daysRemaining", 0)

                views.setTextViewText(R.id.khatam_streak, "🔥 $streakDays ${if (isId) "hari" else "days"}")
                views.setTextViewText(R.id.khatam_label, if (isId) "TARGET KHATAM" else "KHATAM GOAL")
                views.setTextViewText(R.id.khatam_pages, "$todayPages / $targetPages")
                views.setTextViewText(R.id.khatam_pages_label, if (isId) "halaman hari ini" else "pages read today")
                views.setProgressBar(R.id.khatam_progress_bar, 100, percentComplete.coerceIn(0, 100), false)

                val daysText = if (daysRemaining > 0) {
                    "$daysRemaining ${if (isId) "hari tersisa" else "days remaining"}"
                } else {
                    if (isId) "Target harian selesai" else "Daily goal completed"
                }
                views.setTextViewText(R.id.khatam_days_left, daysText)
            }

            // Deep link opens directly to Today tab in Wird
            val pendingIntent = WidgetUtils.createDeepLinkIntent(context, "wird://today", appWidgetId)
            views.setOnClickPendingIntent(R.id.widget_khatam_root, pendingIntent)

            appWidgetManager.updateAppWidget(appWidgetId, views)
        }
    }
}
