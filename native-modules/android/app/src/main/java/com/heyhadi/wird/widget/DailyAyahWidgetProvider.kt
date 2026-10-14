package com.heyhadi.wird.widget

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.widget.RemoteViews
import com.heyhadi.wird.R

class DailyAyahWidgetProvider : AppWidgetProvider() {

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
            val dailyAyah = payload?.optJSONObject("dailyAyah")

            val views = RemoteViews(context.packageName, R.layout.widget_daily_ayah)

            val surahNumber = dailyAyah?.optInt("surahNumber", 1) ?: 1
            val ayahNumber = dailyAyah?.optInt("ayahNumber", 1) ?: 1
            val surahName = dailyAyah?.optString("surahName", "Al-Fatihah") ?: "Al-Fatihah"
            val textArabic = dailyAyah?.optString("textArabic", "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ")
                ?: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ"
            val translation = dailyAyah?.optString(
                "translation",
                if (isId) "Dengan nama Allah Yang Maha Pengasih, Maha Penyayang"
                else "In the name of Allah, the Entirely Merciful, the Especially Merciful"
            ) ?: ""

            views.setTextViewText(R.id.ayah_reference, "$surahName $surahNumber:$ayahNumber")
            views.setTextViewText(R.id.ayah_label, if (isId) "AYAT HARI INI" else "AYAH OF THE DAY")
            views.setTextViewText(R.id.ayah_text_arabic, textArabic)
            views.setTextViewText(R.id.ayah_text_translation, translation)

            // Deep link opens directly to that Surah and Ayah in Wird Reader
            val deepLinkUri = "wird://surah/$surahNumber?ayah=$ayahNumber"
            val pendingIntent = WidgetUtils.createDeepLinkIntent(context, deepLinkUri, appWidgetId)
            views.setOnClickPendingIntent(R.id.widget_daily_ayah_root, pendingIntent)

            appWidgetManager.updateAppWidget(appWidgetId, views)
        }
    }
}
