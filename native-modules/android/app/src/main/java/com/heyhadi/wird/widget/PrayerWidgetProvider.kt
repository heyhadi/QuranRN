package com.heyhadi.wird.widget

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.graphics.Color
import android.os.Bundle
import android.view.View
import android.widget.RemoteViews
import com.heyhadi.wird.R
import org.json.JSONObject

class PrayerWidgetProvider : AppWidgetProvider() {

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        for (appWidgetId in appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId)
        }
    }

    override fun onAppWidgetOptionsChanged(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetId: Int,
        newOptions: Bundle
    ) {
        updateAppWidget(context, appWidgetManager, appWidgetId, newOptions)
        super.onAppWidgetOptionsChanged(context, appWidgetManager, appWidgetId, newOptions)
    }

    companion object {
        fun updateAppWidget(
            context: Context,
            appWidgetManager: AppWidgetManager,
            appWidgetId: Int,
            options: Bundle? = null
        ) {
            val opt = options ?: appWidgetManager.getAppWidgetOptions(appWidgetId)
            val minWidth = opt?.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_WIDTH, 0) ?: 0
            val isMedium = minWidth >= 220

            val payload = WidgetUtils.getStoredPayload(context)
            val language = payload?.optString("language", "en") ?: "en"
            val prayer = payload?.optJSONObject("prayer")

            val layoutId = if (isMedium) R.layout.widget_prayer_medium else R.layout.widget_prayer_small
            val views = RemoteViews(context.packageName, layoutId)

            if (prayer == null) {
                renderPlaceholder(views, isMedium, language)
            } else {
                renderPrayerData(context, views, prayer, isMedium, language)
            }

            // Click pending intent launches the Prayer tab
            val pendingIntent = WidgetUtils.createDeepLinkIntent(context, "wird://prayer", appWidgetId)
            val rootId = if (isMedium) R.id.widget_prayer_medium_root else R.id.widget_prayer_small_root
            views.setOnClickPendingIntent(rootId, pendingIntent)

            appWidgetManager.updateAppWidget(appWidgetId, views)
        }

        private fun renderPlaceholder(views: RemoteViews, isMedium: Boolean, language: String) {
            val isId = language == "id"
            if (isMedium) {
                views.setTextViewText(R.id.prayer_med_location, "Wird")
                views.setTextViewText(R.id.prayer_med_label, if (isId) "JADWAL SALAT" else "PRAYER TIMES")
                views.setTextViewText(R.id.prayer_med_name, if (isId) "Salat • صلاة" else "Prayer • صلاة")
                views.setTextViewText(R.id.prayer_med_time, "--:--")
                views.setTextViewText(R.id.prayer_med_countdown, if (isId) "Buka Wird untuk atur" else "Open Wird to set up")
            } else {
                views.setTextViewText(R.id.prayer_small_location, "Wird")
                views.setTextViewText(R.id.prayer_small_label, if (isId) "SALAT" else "PRAYER")
                views.setTextViewText(R.id.prayer_small_name, if (isId) "Salat • صلاة" else "Prayer • صلاة")
                views.setTextViewText(R.id.prayer_small_time, "--:--")
                views.setTextViewText(R.id.prayer_small_countdown, if (isId) "Buka aplikasi" else "Tap to open")
            }
        }

        private fun renderPrayerData(
            context: Context,
            views: RemoteViews,
            prayer: JSONObject,
            isMedium: Boolean,
            language: String
        ) {
            val isId = language == "id"
            val nextName = prayer.optString("nextPrayerName", "Dhuhr")
            val nextTime = prayer.optString("nextPrayerTime", "--:--")
            val nextTimestamp = prayer.optLong("nextPrayerTimestamp", 0L)
            val location = prayer.optString("locationName", "Wird")

            val localizedName = WidgetUtils.getLocalizedPrayerName(nextName, language)
            val arabicName = WidgetUtils.getArabicPrayerName(nextName)
            val displayName = if (arabicName.isNotEmpty()) "$localizedName • $arabicName" else localizedName
            val countdownText = WidgetUtils.formatCountdown(nextTimestamp, language)

            if (isMedium) {
                views.setTextViewText(R.id.prayer_med_location, location)
                views.setTextViewText(R.id.prayer_med_label, if (isId) "SALAT BERIKUTNYA" else "NEXT PRAYER")
                views.setTextViewText(R.id.prayer_med_name, displayName)
                views.setTextViewText(R.id.prayer_med_time, nextTime)
                views.setTextViewText(R.id.prayer_med_countdown, countdownText)

                val schedule = prayer.optJSONArray("schedule")
                if (schedule != null) {
                    val rowMap = mapOf(
                        "fajr" to Triple(R.id.row_fajr, R.id.row_fajr_indicator, Pair(R.id.row_fajr_name, R.id.row_fajr_time)),
                        "subuh" to Triple(R.id.row_fajr, R.id.row_fajr_indicator, Pair(R.id.row_fajr_name, R.id.row_fajr_time)),
                        "dhuhr" to Triple(R.id.row_dhuhr, R.id.row_dhuhr_indicator, Pair(R.id.row_dhuhr_name, R.id.row_dhuhr_time)),
                        "dzuhur" to Triple(R.id.row_dhuhr, R.id.row_dhuhr_indicator, Pair(R.id.row_dhuhr_name, R.id.row_dhuhr_time)),
                        "asr" to Triple(R.id.row_asr, R.id.row_asr_indicator, Pair(R.id.row_asr_name, R.id.row_asr_time)),
                        "ashar" to Triple(R.id.row_asr, R.id.row_asr_indicator, Pair(R.id.row_asr_name, R.id.row_asr_time)),
                        "maghrib" to Triple(R.id.row_maghrib, R.id.row_maghrib_indicator, Pair(R.id.row_maghrib_name, R.id.row_maghrib_time)),
                        "isha" to Triple(R.id.row_isha, R.id.row_isha_indicator, Pair(R.id.row_isha_name, R.id.row_isha_time)),
                        "isya" to Triple(R.id.row_isha, R.id.row_isha_indicator, Pair(R.id.row_isha_name, R.id.row_isha_time))
                    )

                    for (i in 0 until schedule.length()) {
                        val item = schedule.optJSONObject(i) ?: continue
                        val prayerKey = item.optString("name", "").lowercase().trim()
                        val rowConfig = rowMap[prayerKey] ?: continue

                        val (rowId, indicatorId, textIds) = rowConfig
                        val (nameId, timeId) = textIds
                        val pTime = item.optString("time", "--:--")
                        val isNext = item.optBoolean("isNext", false)

                        views.setTextViewText(nameId, WidgetUtils.getLocalizedPrayerName(prayerKey, language))
                        views.setTextViewText(timeId, pTime)

                        if (isNext) {
                            views.setInt(rowId, "setBackgroundResource", R.drawable.widget_active_prayer_bg)
                            views.setViewVisibility(indicatorId, View.VISIBLE)
                            views.setTextColor(nameId, Color.parseColor("#FFFFFF"))
                            views.setTextColor(timeId, Color.parseColor("#FFFFFF"))
                        } else {
                            views.setInt(rowId, "setBackgroundResource", 0)
                            views.setViewVisibility(indicatorId, View.GONE)
                            views.setTextColor(nameId, Color.parseColor("#A3C2B8"))
                            views.setTextColor(timeId, Color.parseColor("#A3C2B8"))
                        }
                    }
                }
            } else {
                views.setTextViewText(R.id.prayer_small_location, location)
                views.setTextViewText(R.id.prayer_small_label, if (isId) "SALAT BERIKUTNYA" else "NEXT PRAYER")
                views.setTextViewText(R.id.prayer_small_name, displayName)
                views.setTextViewText(R.id.prayer_small_time, nextTime)
                views.setTextViewText(R.id.prayer_small_countdown, countdownText)
            }
        }
    }
}
