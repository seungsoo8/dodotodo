package vito.dodotodo.com;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.widget.RemoteViews;

import org.json.JSONArray;
import org.json.JSONObject;

public class PlenioWidgetProvider extends AppWidgetProvider {

    @Override
    public void onUpdate(Context ctx, AppWidgetManager manager, int[] ids) {
        for (int id : ids) updateWidget(ctx, manager, id);
    }

    static void updateWidget(Context ctx, AppWidgetManager manager, int widgetId) {
        SharedPreferences prefs = ctx.getSharedPreferences(WidgetDataPlugin.PREFS_NAME, Context.MODE_PRIVATE);
        String json = prefs.getString(WidgetDataPlugin.KEY_TODOS, null);

        int remaining = 0;
        int completedToday = 0;
        String topTitle = "할 일을 추가해보세요";

        if (json != null) {
            try {
                JSONObject payload = new JSONObject(json);
                completedToday = payload.optInt("completedToday", 0);
                JSONArray todos = payload.getJSONArray("todos");
                remaining = todos.length();
                if (remaining > 0) topTitle = todos.getJSONObject(0).getString("title");
            } catch (Exception ignored) {}
        }

        int total = completedToday + remaining;
        String progressText = total > 0 ? completedToday + " / " + total : "—";
        String countText = remaining > 0 ? String.valueOf(remaining) : "✓";
        String bottomText = remaining > 0 ? topTitle : (total > 0 ? "모두 완료! 🎉" : "할 일을 추가해보세요");

        RemoteViews views = new RemoteViews(ctx.getPackageName(), R.layout.widget_plenio);
        views.setTextViewText(R.id.widget_count, countText);
        views.setTextViewText(R.id.widget_progress, progressText);
        views.setTextViewText(R.id.widget_top_todo, bottomText);

        Intent intent = new Intent(ctx, MainActivity.class);
        PendingIntent pending = PendingIntent.getActivity(ctx, 0, intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        views.setOnClickPendingIntent(R.id.widget_root, pending);

        manager.updateAppWidget(widgetId, views);
    }
}
