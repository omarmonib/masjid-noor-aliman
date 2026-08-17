package com.masjidnooraliman.app;

import android.os.Bundle;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebViewClient;

public class MainActivity extends BridgeActivity {

    // Synced from capacitor-www/offline.html into android assets on `cap sync`
    // (webDir: "capacitor-www" in capacitor.config.ts -> android/app/src/main/assets/public/)
    private static final String OFFLINE_URL = "file:///android_asset/public/offline.html";

    private boolean showingOffline = false;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        attachOfflineFallbackClient();
    }

    /**
     * Wraps Capacitor's own BridgeWebViewClient so the bridge/plugin
     * message handling keeps working exactly as before, but intercepts
     * main-frame connectivity errors before Chromium renders its native
     * net::ERR_* interstitial, and shows a local bundled Arabic offline
     * page instead.
     */
    private void attachOfflineFallbackClient() {
        WebView webView = getBridge().getWebView();

        webView.setWebViewClient(new BridgeWebViewClient(getBridge()) {
            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                if (request.isForMainFrame() && isConnectivityError(error.getErrorCode())) {
                    showOfflinePage();
                    return;
                }
                super.onReceivedError(view, request, error);
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                // Once any non-offline page finishes loading (i.e. we're
                // back online and the retry succeeded), allow future
                // errors to trigger the offline page again.
                if (url == null || !url.contains("offline.html")) {
                    showingOffline = false;
                }
            }
        });
    }

    private boolean isConnectivityError(int errorCode) {
        return errorCode == WebViewClient.ERROR_HOST_LOOKUP
                || errorCode == WebViewClient.ERROR_CONNECT
                || errorCode == WebViewClient.ERROR_TIMEOUT
                || errorCode == WebViewClient.ERROR_FAILED_SSL_HANDSHAKE
                || errorCode == WebViewClient.ERROR_UNKNOWN;
    }

    private void showOfflinePage() {
        if (showingOffline) return;
        showingOffline = true;
        runOnUiThread(() -> getBridge().getWebView().loadUrl(OFFLINE_URL));
    }
}