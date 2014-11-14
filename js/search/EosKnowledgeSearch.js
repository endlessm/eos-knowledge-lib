const Endless = imports.gi.Endless;

// Make a backup copy of the array
let _oldSearchPath = imports.searchPath.slice(0);
imports.searchPath.unshift(Endless.getCurrentFileDir());

const ArticleObjectModel = imports.articleObjectModel.ArticleObjectModel;
const ContentObjectModel = imports.contentObjectModel.ContentObjectModel;
const Engine = imports.engine.Engine;
const ImageObjectModel = imports.mediaObjectModel.ImageObjectModel;
const MediaObjectModel = imports.mediaObjectModel.MediaObjectModel;
const SearchProvider = imports.searchProvider.SearchProvider;
const tree_model_from_tree_node = imports.treeNode.tree_model_from_tree_node;
const TreeNodeColumn = imports.treeNode.TreeNodeColumn;
const VideoObjectModel = imports.mediaObjectModel.VideoObjectModel;

imports.searchPath = _oldSearchPath;
