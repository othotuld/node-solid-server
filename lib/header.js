var li = require('li');

var path = require('path');
var S = require('string');
var metadata = require('./metadata.js');
var utils = require('./utils.js');
var ldpVocab = require('./vocab/ldp.js');

function addLink(res, value, rel) {
    var oldLink = res.get('Link');
    if (oldLink === undefined)
        res.set('Link', '<' + value + '>; rel=\'' + rel + '\'');
    else
        res.set('Link', oldLink + ', ' + '<' + value +
            '>; rel=\'' + rel + '\'');
}

function addLinks(res, fileMetadata) {
    if (fileMetadata.isResource)
        addLink(res, ldpVocab.Resource, 'type');
    if (fileMetadata.isSourceResource)
        addLink(res, ldpVocab.RDFSource, 'type');
    if (fileMetadata.isContainer)
        addLink(res, ldpVocab.Container, 'type');
    if (fileMetadata.isBasicContainer)
        addLink(res, ldpVocab.BasicContainer, 'type');
    if (fileMetadata.isDirectContainer)
        addLink(res, ldpVocab.DirectContainer, 'type');
}

function linksHandler(req, res, next) {
    var ldp = req.app.locals.ldp;
    var filename = utils.uriToFilename(req.url, ldp.root);

    filename = path.join(filename, req.path);
    if (ldp.isMetadataFile(filename)) {
        debug.metadata("Trying to access metadata file as regular file.");
        return res.send(404);
    }
    var fileMetadata = new metadata.Metadata();
    if (S(filename).endsWith('/')) {
        fileMetadata.isContainer = true;
        fileMetadata.isBasicContainer = true;
    } else {
        fileMetadata.isResource = true;
    }
    addLinks(res, fileMetadata);
    next();
}

function parseMetadataFromHeader(linkHeader) {
    var fileMetadata = new metadata.Metadata();
    if (linkHeader === undefined)
        return fileMetadata;
    var links = linkHeader.split(',');
    for (var linkIndex in links) {
        var link = links[linkIndex];
        var parsedLinks = li.parse(link);
        for (var rel in parsedLinks) {
            if (rel === 'type') {
                if (parsedLinks[rel] === ldpVocab.Resource)
                    fileMetadata.isResource = true;
                else if (parsedLinks[rel] === ldpVocab.RDFSource)
                    fileMetadata.isSourceResource = true;
                else if (parsedLinks[rel] === ldpVocab.Container)
                    fileMetadata.isContainer = true;
                else if (parsedLinks[rel] === ldpVocab.BasicContainer)
                    fileMetadata.isBasicContainer = true;
                else if (parsedLinks[rel] === ldpVocab.DirectContainer)
                    fileMetadata.isDirectContainer = true;
            }
        }
    }
    return fileMetadata;
}

function parseAcceptHeader(req) {
    var acceptFinalValue;
    var acceptHeader = req.get('Accept');
    if (acceptHeader === undefined) {
        acceptFinalValue = undefined;
    } else {
        switch (acceptHeader) {
            case 'text/turtle':
            case 'applicatoin/x-turtle':
            case 'text/n3':
            case 'application/rdf+xml':
            case 'application/n3':
            case 'application/json+ld':
            case 'application/nquads':
            case 'application/n-quads':
                acceptFinalValue = acceptHeader;
                break;
            default:
                acceptFinalValue = undefined;
        }
    }
    return acceptFinalValue;
}

module.exports.addLink = addLink;
module.exports.addLinks = addLinks;
module.exports.parseMetadataFromHeader = parseMetadataFromHeader;
module.exports.parseAcceptHeader = parseAcceptHeader;
module.exports.linksHandler = linksHandler;