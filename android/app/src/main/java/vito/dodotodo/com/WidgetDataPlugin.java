package vito.dodotodo.com;

import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "WidgetData")
public class WidgetDataPlugin extends Plugin {

    static final String PREFS_NAME = "plenio_widget";
    static final String KEY_TODOS  = "widget_todos";

    @PluginMethod
    public void setTodos(PluginCall call) {
        String todosJson = call.getString("todosJson");
        if (todosJson == null) { call.reject("todosJson is required"); return; }

        Context ctx = getContext();
        ctx.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
           .edit().putString(KEY_TODOS, todosJson).apply();

        AppWidgetManager manager = AppWidgetManager.getInstance(ctx);
        int[] ids = manager.getAppWidgetIds(new ComponentName(ctx, PlenioWidgetProvider.class));
        if (ids.length > 0) {
            Intent intent = new Intent(ctx, PlenioWidgetProvider.class);
            intent.setAction(AppWidgetManager.ACTION_APPWIDGET_UPDATE);
            intent.putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, ids);
            ctx.sendBroadcast(intent);
        }

        call.resolve();
    }
}
