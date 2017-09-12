/* Copyright 2014  Endless Mobile
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License as
 * published by the Free Software Foundation; either version 2 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

#ifndef __EKNC_DATABASE_MANAGER_H__
#define __EKNC_DATABASE_MANAGER_H__

#include <glib-object.h>
#include <json-glib/json-glib.h>
#include <xapian-glib.h>

G_BEGIN_DECLS

#define EKNC_TYPE_DATABASE_MANAGER eknc_database_manager_get_type()
G_DECLARE_FINAL_TYPE (EkncDatabaseManager, eknc_database_manager, EKNC, DATABASE_MANAGER, GObject)

typedef struct {
  const char *path;
  const char *manifest_path;
} EkncDatabase;

typedef enum {
  EKNC_DATABASE_MANAGER_ERROR_NOT_FOUND,
  EKNC_DATABASE_MANAGER_ERROR_INVALID_PATH,
  EKNC_DATABASE_MANAGER_ERROR_INVALID_PARAMS
} EkncDatabaseManagerError;

#define EKNC_DATABASE_MANAGER_ERROR eknc_database_manager_error_quark()
GQuark eknc_database_manager_error_quark (void);

GType
eknc_database_manager_get_type (void) G_GNUC_CONST;

EkncDatabaseManager *
eknc_database_manager_new (void);

JsonObject *
eknc_database_manager_query_db (EkncDatabaseManager *self,
                                const EkncDatabase *db,
                                GHashTable *query,
                                GError **error_out);

JsonObject *
eknc_database_manager_fix_query (EkncDatabaseManager *self,
                                 const EkncDatabase *db,
                                 GHashTable *query,
                                 GError **error_out);

G_END_DECLS

#endif /* __EKNC_DATABASE_MANAGER_H__ */
