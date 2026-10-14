package com.heyhadi.wird.widget

import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class WirdWidgetModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName() = "WirdWidgetModule"

    @ReactMethod
    fun updateWidgetData(data: String, promise: Promise) {
        try {
            val context = reactApplicationContext
            val prefs = context.getSharedPreferences(WidgetUtils.PREFS_NAME, Context.MODE_PRIVATE)
            prefs.edit().putString(WidgetUtils.KEY_PAYLOAD, data).apply()

            val appWidgetManager = AppWidgetManager.getInstance(context)

            // Update Prayer Widgets
            val prayerComponent = ComponentName(context, PrayerWidgetProvider::class.java)
            val prayerIds = appWidgetManager.getAppWidgetIds(prayerComponent)
            if (prayerIds.isNotEmpty()) {
                val intent = Intent(context, PrayerWidgetProvider::class.java).apply {
                    action = AppWidgetManager.ACTION_APPWIDGET_UPDATE
                    putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, prayerIds)
                }
                context.sendBroadcast(intent)
            }

            // Update Daily Ayah Widgets
            val ayahComponent = ComponentName(context, DailyAyahWidgetProvider::class.java)
            val ayahIds = appWidgetManager.getAppWidgetIds(ayahComponent)
            if (ayahIds.isNotEmpty()) {
                val intent = Intent(context, DailyAyahWidgetProvider::class.java).apply {
                    action = AppWidgetManager.ACTION_APPWIDGET_UPDATE
                    putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, ayahIds)
                }
                context.sendBroadcast(intent)
            }

            // Update Khatam Widgets
            val khatamComponent = ComponentName(context, KhatamWidgetProvider::class.java)
            val khatamIds = appWidgetManager.getAppWidgetIds(khatamComponent)
            if (khatamIds.isNotEmpty()) {
                val intent = Intent(context, KhatamWidgetProvider::class.java).apply {
                    action = AppWidgetManager.ACTION_APPWIDGET_UPDATE
                    putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, khatamIds)
                }
                context.sendBroadcast(intent)
            }

            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("WIDGET_UPDATE_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun getWidgetData(promise: Promise) {
        try {
            val context = reactApplicationContext
            val prefs = context.getSharedPreferences(WidgetUtils.PREFS_NAME, Context.MODE_PRIVATE)
            val data = prefs.getString(WidgetUtils.KEY_PAYLOAD, null)
            promise.resolve(data)
        } catch (e: Exception) {
            promise.reject("WIDGET_GET_ERROR", e.message, e)
        }
    }
}
