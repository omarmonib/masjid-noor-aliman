package com.masjidnooraliman.app;

import android.os.Bundle;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebViewClient;

public class MainActivity extends BridgeActivity {

    private static final String OFFLINE_URL = "file:///android_asset/public/offline.html";

    private boolean showingOffline = false;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(AdhanAlarmPlugin.class);
        super.onCreate(savedInstanceState);
        attachOfflineFallbackClient();
    }

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