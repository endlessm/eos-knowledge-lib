const Endless = imports.gi.Endless;

// Make a backup copy of the array
let _oldSearchPath = imports.searchPath.slice(0);
imports.searchPath.unshift(Endless.getCurrentFileDir());

const ArticleObjectModel = imports.articleObjectModel.ArticleObjectModel;
const ContentObjectModel = imports.contentObjectModel.ContentObjectModel;
const Engine = imports.engine.Engine;
const get_data_dir_for_domain = imports.datadir.get_data_dir_for_domain;
const ImageObjectModel = imports.mediaObjectModel.ImageObjectModel;
const MediaObjectModel = imports.mediaObjectModel.MediaObjectModel;
const QueryObject = imports.queryObject.QueryObject;
const QueryObjectMatch = imports.queryObject.QueryObjectMatch;
const QueryObjectOrder = imports.queryObject.QueryObjectOrder;
const QueryObjectSort = imports.queryObject.QueryObjectSort;
const QueryObjectType = imports.queryObject.QueryObjectType;
const AppSearchProvider = imports.searchProvider.AppSearchProvider;
const GlobalSearchProvider = imports.searchProvider.GlobalSearchProvider;
const tree_model_from_tree_node = imports.treeNode.tree_model_from_tree_node;
const TreeNodeColumn = imports.treeNode.TreeNodeColumn;
const VideoObjectModel = imports.mediaObjectModel.VideoObjectModel;

imports.searchPath = _oldSearchPath;
