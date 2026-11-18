package com.aashidani.lazygamer;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;
import static org.junit.Assume.assumeTrue;

import android.content.pm.ActivityInfo;
import android.os.SystemClock;
import android.view.KeyEvent;
import androidx.test.core.app.ActivityScenario;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;
import java.io.File;
import java.util.Locale;
import java.util.concurrent.ArrayBlockingQueue;
import java.util.concurrent.TimeUnit;
import org.json.JSONObject;
import org.junit.Test;
import org.junit.runner.RunWith;

/** Run on a fresh, disposable emulator with airplane mode enabled. */
@RunWith(AndroidJUnit4.class)
public class OfflineTownTest {
    @Test
    public void restoresTownAfterPackageUpdate() throws Exception {
        String expected = InstrumentationRegistry.getArguments().getString("expectedCoins");
        assumeTrue(expected != null);
        try (var app = ActivityScenario.launch(MainActivity.class)) {
            waitFor(app, "document.querySelector('canvas') !== null");
            assertEquals(JSONObject.quote(expected), javascript(app, "document.querySelector('.coin-count').textContent"));
        }
    }

    @Test
    public void offlineLaunchRotationBackAndSave() throws Exception {
        var instrument = InstrumentationRegistry.getInstrumentation();
        assertEquals("1", android.provider.Settings.Global.getString(
            instrument.getTargetContext().getContentResolver(), "airplane_mode_on"));
        String purse;
        try (var app = ActivityScenario.launch(MainActivity.class)) {
            waitFor(app, "document.body.innerText.includes('Tap to start')");
            press(app, "Settings");
            press(app, "Privacy");
            waitFor(app, "document.body.innerText.includes('What the game saves')");
            instrument.sendKeyDownUpSync(KeyEvent.KEYCODE_BACK);
            waitFor(app, "document.querySelector('[role=dialog] h2')?.textContent === 'Settings'");
            press(app, "Export or import town");
            // Model an older web town moving into the installed app via the normal save-code screen.
            assertEquals("true", javascript(app, """
                (() => {
                  const field = document.querySelector('textarea');
                  const now = Date.now();
                  const town = {band:'explorer', playerName:'Clover', coins:75, lastAt:now,
                    buildings:{coconut:{level:1, stock:2}}, tutorialSeen:true, guidedSeen:true};
                  const payload = btoa(JSON.stringify({version:5,state:{town}}))
                    .replaceAll('+','-').replaceAll('/','_').replace(/=+$/, '');
                  Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')
                    .set.call(field, 'LG-' + payload);
                  field.dispatchEvent(new Event('input', {bubbles:true}));
                  return true;
                })()
                """));
            press(app, "Check save code");
            press(app, "Replace town");
            waitFor(app, "document.querySelector('canvas') !== null");
            press(app, "Coconut Stall");
            waitFor(app, """
                (() => {
                  const sale = document.querySelector('.collect-button:not(:disabled)');
                  if (!sale) return false;
                  sale.click();
                  return true;
                })()
                """);
            waitFor(app, "Number(document.querySelector('.coin-count')?.textContent) > 75");
            purse = javascript(app, "document.querySelector('.coin-count').textContent");
            instrument.sendKeyDownUpSync(KeyEvent.KEYCODE_BACK);
            waitFor(app, "!document.querySelector('[role=dialog]')");
            press(app, "Growth");
            waitFor(app, "document.body.innerText.includes('Town growth')");
            app.onActivity(activity -> activity.setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE));
            waitFor(app, "innerWidth > innerHeight && document.body.innerText.includes('Town growth')");
            waitFor(app, "document.documentElement.scrollWidth <= innerWidth");
            instrument.sendKeyDownUpSync(KeyEvent.KEYCODE_BACK);
            waitFor(app, "document.querySelector('[aria-current=page]')?.textContent === 'Town'");
            assertTrue(new File(instrument.getTargetContext().getNoBackupFilesDir(), "town.json").exists());
        }
        try (var app = ActivityScenario.launch(MainActivity.class)) {
            waitFor(app, "document.querySelector('canvas') !== null");
            assertEquals(purse, javascript(app, "document.querySelector('.coin-count').textContent"));
        }
    }

    private String javascript(ActivityScenario<MainActivity> app, String expression) throws InterruptedException {
        var answer = new ArrayBlockingQueue<String>(1);
        app.onActivity(activity -> activity.getBridge().getWebView().evaluateJavascript(expression, answer::offer));
        return answer.poll(5, TimeUnit.SECONDS);
    }

    private void waitFor(ActivityScenario<MainActivity> app, String condition) throws InterruptedException {
        long deadline = SystemClock.elapsedRealtime() + 15_000;
        while (SystemClock.elapsedRealtime() < deadline) {
            if ("true".equals(javascript(app, condition))) return;
            Thread.sleep(100);
        }
        throw new AssertionError("Expected: " + condition + ". Screen: " +
            javascript(app, "document.body.innerText.slice(0, 550)"));
    }

    private void press(ActivityScenario<MainActivity> app, String name) throws InterruptedException {
        waitFor(app, String.format(Locale.ROOT, """
            (() => {
              const button = [...document.querySelectorAll('button:not(:disabled)')].find(
                item => item.offsetWidth && !item.closest('[inert]') &&
                  (item.getAttribute('aria-label') === %1$s || item.textContent.trim() === %1$s));
              if (!button) return false;
              button.click();
              return true;
            })()
            """, JSONObject.quote(name)));
    }
}
