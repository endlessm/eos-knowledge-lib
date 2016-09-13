/* -*- mode: C; c-file-style: "gnu"; indent-tabs-mode: nil; -*- */
/*
 * ekn-runtime-document-viewer.c
 *
 * Copyright (C) 2016 Endless Mobile, Inc.
 *
 * This library is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation; either
 * version 2.1 of the License, or (at your option) any later version.
 *
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Lesser General Public License for more details.
 * 
 * You should have received a copy of the GNU Lesser General Public
 * License along with this library; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301  USA
 *
 * Author: Juan Pablo Ugarte <ugarte@endlessm.com>
 *
 */

#include "ekn-runtime-document-viewer.h"

typedef struct
{
  gchar *index_uri;
  gchar *index_scheme;
  gboolean show_on_load;

  WebKitWebView *webview;
  GtkHeaderBar  *headerbar;
  GtkWidget     *back;
  GtkWidget     *forward;
} EknRuntimeDocumentViewerPrivate;

struct _EknRuntimeDocumentViewer
{
  GtkWindow parent_instance;
};

enum
{
  PROP_0,

  PROP_INDEX_URI,
  PROP_SHOW_ON_LOAD,
  N_PROPERTIES
};

static GParamSpec *properties[N_PROPERTIES];

G_DEFINE_TYPE_WITH_PRIVATE (EknRuntimeDocumentViewer,
                            ekn_runtime_document_viewer,
                            GTK_TYPE_WINDOW);

#define ERDV_PRIVATE(d) ((EknRuntimeDocumentViewerPrivate *) ekn_runtime_document_viewer_get_instance_private(d))

static void
on_back_forward_list_changed (WebKitBackForwardList     *list,
                              WebKitBackForwardListItem *items_added,
                              GList                     *items_removed,
                              EknRuntimeDocumentViewer  *dialog)
{
  EknRuntimeDocumentViewerPrivate *priv = ERDV_PRIVATE (dialog);

  gtk_widget_set_sensitive (priv->back, webkit_web_view_can_go_back (priv->webview));
  gtk_widget_set_sensitive (priv->forward, webkit_web_view_can_go_forward (priv->webview));
}

static void
ekn_runtime_document_viewer_init (EknRuntimeDocumentViewer *dialog)
{
  EknRuntimeDocumentViewerPrivate *priv = ERDV_PRIVATE (dialog);

  priv->show_on_load = TRUE;

  gtk_widget_init_template (GTK_WIDGET (dialog));

  g_object_bind_property (priv->webview, "title", priv->headerbar, "title", 0);

  g_signal_connect (webkit_web_view_get_back_forward_list (priv->webview),
                    "changed",
                    G_CALLBACK (on_back_forward_list_changed),
                    dialog);
}

static void
ekn_runtime_document_viewer_finalize (GObject *object)
{
  EknRuntimeDocumentViewerPrivate *priv = ERDV_PRIVATE (EKN_RUNTIME_DOCUMENT_VIEWER (object));

  g_clear_pointer (&priv->index_uri, g_free);
  g_clear_pointer (&priv->index_scheme, g_free);

  G_OBJECT_CLASS (ekn_runtime_document_viewer_parent_class)->finalize (object);
}

static void
ekn_runtime_document_viewer_set_property (GObject      *object,
                                          guint         prop_id,
                                          const GValue *value,
                                          GParamSpec   *pspec)
{
  g_return_if_fail (EKN_IS_RUNTIME_DOCUMENT_VIEWER (object));

  switch (prop_id)
    {
      case PROP_INDEX_URI:
        ekn_runtime_document_viewer_set_index_uri (EKN_RUNTIME_DOCUMENT_VIEWER (object),
                                                   g_value_get_string (value));
      break;
      case PROP_SHOW_ON_LOAD:
        ekn_runtime_document_viewer_set_show_on_load (EKN_RUNTIME_DOCUMENT_VIEWER (object),
                                                      g_value_get_boolean (value));
      break;
      default:
        G_OBJECT_WARN_INVALID_PROPERTY_ID (object, prop_id, pspec);
      break;
    }
}

static void
ekn_runtime_document_viewer_get_property (GObject    *object,
                                          guint       prop_id,
                                          GValue     *value,
                                          GParamSpec *pspec)
{
  EknRuntimeDocumentViewerPrivate *priv;

  g_return_if_fail (EKN_IS_RUNTIME_DOCUMENT_VIEWER (object));
  priv = ERDV_PRIVATE (EKN_RUNTIME_DOCUMENT_VIEWER (object));

  switch (prop_id)
    {
      case PROP_INDEX_URI:
        g_value_set_string (value, priv->index_uri);
      break;
      case PROP_SHOW_ON_LOAD:
        g_value_set_boolean (value, priv->show_on_load);
      break;
      default:
        G_OBJECT_WARN_INVALID_PROPERTY_ID (object, prop_id, pspec);
      break;
    }
}

static void
on_back_clicked (GtkButton *button, EknRuntimeDocumentViewer *dialog)
{
  EknRuntimeDocumentViewerPrivate *priv = ERDV_PRIVATE (dialog);
  webkit_web_view_go_back (priv->webview);
}

static void
on_forward_clicked (GtkButton *button, EknRuntimeDocumentViewer *dialog)
{
  EknRuntimeDocumentViewerPrivate *priv = ERDV_PRIVATE (dialog);
  webkit_web_view_go_forward (priv->webview);
}

static void
on_home_clicked (GtkButton *button, EknRuntimeDocumentViewer *dialog)
{
  EknRuntimeDocumentViewerPrivate *priv = ERDV_PRIVATE (dialog);
  webkit_web_view_load_uri (priv->webview, priv->index_uri);
}

static gboolean
on_webview_decide_policy (WebKitWebView            *web_view,
                          WebKitPolicyDecision     *decision,
                          WebKitPolicyDecisionType  type,
                          EknRuntimeDocumentViewer *dialog)
{
  EknRuntimeDocumentViewerPrivate *priv = ERDV_PRIVATE (dialog);
  WebKitNavigationPolicyDecision *ndecision;
  WebKitNavigationAction *action;
  WebKitURIRequest *request;
  const gchar *uri;
  gchar *scheme;

  /* Home URI scheme is always handled inline */
  if (type == WEBKIT_POLICY_DECISION_TYPE_NAVIGATION_ACTION &&
      (ndecision = WEBKIT_NAVIGATION_POLICY_DECISION (decision)) &&
      (action = webkit_navigation_policy_decision_get_navigation_action (ndecision)) &&
      (request = webkit_navigation_action_get_request (action)) &&
      (uri = webkit_uri_request_get_uri (request)) &&
      (scheme = g_uri_parse_scheme (uri)) &&
      !g_str_equal (scheme, priv->index_scheme))
    {
      gtk_show_uri (NULL, uri, GDK_CURRENT_TIME, NULL);
      webkit_policy_decision_ignore (decision);
      g_free (scheme);
      /* Ignore the request since it will be handled by gtk_show_uri() */
      return TRUE;
    }

  /* Making no decision results in webkit_policy_decision_use(). */
  return FALSE;
}

static void
on_webview_load_changed (WebKitWebView            *webview,
                         WebKitLoadEvent           load_event,
                         EknRuntimeDocumentViewer *dialog)
{
  EknRuntimeDocumentViewerPrivate *priv = ERDV_PRIVATE (dialog);

  if (load_event == WEBKIT_LOAD_FINISHED && priv->show_on_load &&
      !gtk_widget_get_visible (GTK_WIDGET (dialog)))
    {
      /* Presenting the window at this point of the webview load avoids showing
       * a blank webview for a split second!
       */
      gtk_window_present (GTK_WINDOW (dialog));
    }
}

static void
ekn_runtime_document_viewer_class_init (EknRuntimeDocumentViewerClass *klass)
{
  GObjectClass *object_class = G_OBJECT_CLASS (klass);
  GtkWidgetClass *widget_class = GTK_WIDGET_CLASS (klass);

  object_class->finalize = ekn_runtime_document_viewer_finalize;
  object_class->set_property = ekn_runtime_document_viewer_set_property;
  object_class->get_property = ekn_runtime_document_viewer_get_property;

  /* Properties */
  properties[PROP_INDEX_URI] =
    g_param_spec_string ("index-uri",
                         "Index uri",
                         "The document index URI to display",
                         NULL,
                         G_PARAM_READWRITE);

  properties[PROP_SHOW_ON_LOAD] =
    g_param_spec_boolean ("show-on-load",
                          "Shown on Load",
                          "Defines whether or not the dialog will be shown automaticaly on index_uri load",
                          TRUE,
                          G_PARAM_READWRITE);

  g_object_class_install_properties (object_class, N_PROPERTIES, properties);

  /* Template */
  gtk_widget_class_set_template_from_resource (widget_class, "/com/endlessm/knowledge-private/EknRuntimeDocumentViewer.ui");

  gtk_widget_class_bind_template_child_private (widget_class, EknRuntimeDocumentViewer, webview);
  gtk_widget_class_bind_template_child_private (widget_class, EknRuntimeDocumentViewer, headerbar);
  gtk_widget_class_bind_template_child_private (widget_class, EknRuntimeDocumentViewer, back);
  gtk_widget_class_bind_template_child_private (widget_class, EknRuntimeDocumentViewer, forward);

  gtk_widget_class_bind_template_callback (widget_class, on_back_clicked);
  gtk_widget_class_bind_template_callback (widget_class, on_forward_clicked);
  gtk_widget_class_bind_template_callback (widget_class, on_home_clicked);
  gtk_widget_class_bind_template_callback (widget_class, on_webview_decide_policy);
  gtk_widget_class_bind_template_callback (widget_class, on_webview_load_changed);
}

/********************************* Public API *********************************/

/**
 * ekn_runtime_document_viewer_get_index_uri:
 * @dialog: a #EknRuntimeDocumentViewer
 *
 * Returns the index uri displayed in the web view.
 *
 */
const gchar *
ekn_runtime_document_viewer_get_index_uri (EknRuntimeDocumentViewer *dialog)
{
  g_return_val_if_fail (EKN_IS_RUNTIME_DOCUMENT_VIEWER (dialog), NULL);
  return ERDV_PRIVATE (dialog)->index_uri;
}

/**
 * ekn_runtime_document_viewer_set_index_uri:
 * @dialog: a #EknRuntimeDocumentViewer
 * @uri:
 *
 * Sets the index URI to display in the web view.
 *
 */
void
ekn_runtime_document_viewer_set_index_uri (EknRuntimeDocumentViewer *dialog,
                                           const gchar              *uri)
{
  EknRuntimeDocumentViewerPrivate *priv;

  g_return_if_fail (EKN_IS_RUNTIME_DOCUMENT_VIEWER (dialog));

  priv = ERDV_PRIVATE (dialog);

  if (g_strcmp0 (priv->index_uri, uri))
    {
      g_free (priv->index_uri);

      priv->index_uri = g_strdup (uri);
      priv->index_scheme = g_uri_parse_scheme (uri);

      g_object_notify_by_pspec (G_OBJECT (dialog), properties[PROP_INDEX_URI]);
    }

    webkit_web_view_load_uri (priv->webview, uri);
}


/**
 * ekn_runtime_document_viewer_get_show_on_load:
 * @dialog: a #EknRuntimeDocumentViewer
 *
 * Returns whether or not the dialog will be shown automaticaly on index_uri load.
 *
 */
gboolean
ekn_runtime_document_viewer_get_show_on_load (EknRuntimeDocumentViewer *dialog)
{
  g_return_val_if_fail (EKN_IS_RUNTIME_DOCUMENT_VIEWER (dialog), FALSE);
  return ERDV_PRIVATE (dialog)->show_on_load;
}

/**
 * ekn_runtime_document_viewer_set_show_on_load:
 * @dialog: a #EknRuntimeDocumentViewer
 * @show_on_load:
 *
 * Sets whether or not the dialog will be shown automaticaly on index_uri load.
 *
 */
void
ekn_runtime_document_viewer_set_show_on_load (EknRuntimeDocumentViewer *dialog,
                                              gboolean                  show_on_load)
{
  EknRuntimeDocumentViewerPrivate *priv;

  g_return_if_fail (EKN_IS_RUNTIME_DOCUMENT_VIEWER (dialog));

  priv = ERDV_PRIVATE (dialog);

  if (priv->show_on_load != show_on_load)
    {
      priv->show_on_load = show_on_load;
      g_object_notify_by_pspec (G_OBJECT (dialog), properties[PROP_SHOW_ON_LOAD]);
    }
}
