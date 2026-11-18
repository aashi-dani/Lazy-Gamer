package com.aashidani.lazygamer;

import android.content.Context;
import android.print.PrintManager;
import android.util.AtomicFile;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.File;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;

@CapacitorPlugin(name = "LocalDevice")
public class LocalDevicePlugin extends Plugin {
    private AtomicFile privateFile(PluginCall call) {
        String key = call.getString("key", "");
        if (!key.equals("town") && !key.equals("parent-pin")) {
            call.reject("Unknown local record");
            return null;
        }
        return new AtomicFile(new File(getContext().getNoBackupFilesDir(), key + ".json"));
    }

    @PluginMethod
    public void read(PluginCall call) {
        AtomicFile file = privateFile(call);
        if (file == null) return;
        try {
            var result = new JSObject();
            result.put("value", new String(file.readFully(), StandardCharsets.UTF_8));
            call.resolve(result);
        } catch (FileNotFoundException error) {
            if (file.getBaseFile().exists()) call.reject("Could not read the local record");
            else call.resolve(new JSObject());
        } catch (IOException error) {
            call.reject("Could not read the local record");
        }
    }

    @PluginMethod
    public void write(PluginCall call) {
        AtomicFile file = privateFile(call);
        if (file == null) return;
        String value = call.getString("value");
        if (value == null) {
            call.reject("Missing local record");
            return;
        }
        FileOutputStream output = null;
        try {
            output = file.startWrite();
            output.write(value.getBytes(StandardCharsets.UTF_8));
            file.finishWrite(output);
            call.resolve();
        } catch (IOException error) {
            if (output != null) file.failWrite(output);
            call.reject("Could not save the local record");
        }
    }

    @PluginMethod
    public void printReport(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            var printer = (PrintManager) getActivity().getSystemService(Context.PRINT_SERVICE);
            if (printer == null) {
                call.reject("Printing is unavailable");
                return;
            }
            String title = "Lazy Gamer progress summary";
            try {
                printer.print(title, getBridge().getWebView().createPrintDocumentAdapter(title), null);
                call.resolve();
            } catch (IllegalStateException error) {
                call.reject("Could not open the print preview");
            }
        });
    }
}
