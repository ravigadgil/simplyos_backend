const fs = require('fs');

let cache = require('memory-cache');
let MetaInfo = require('../models/MetaInfo');

module.exports = {
  clearCache: function (key) {
    // clean it and return
  },

  isWithinRange(text, min, max) {
    // check if text is between min and max length
  },

  async modifyMetaInfo(filePath, page) {
    console.log("Path", filePath, page);

    let meta = await getMetaData(page);
    await new Promise(resolve => setTimeout(resolve, 1000)); // 3 sec
    return meta;
  }
}

const getMetaData = (page) => {
  const meta = new MetaInfo();
  let meta_info = {
    'status': false,
    'data': {
      'title': 'Home Page',
      'keyword': 'Home Page',
      'meta_info': {
        'des': 'Home Page'
      }
    }
  };
  let key = 'meta__' + page;
  let cachedMeta = cache.get(key);
  if (cachedMeta) {
    return cachedMeta
  }
  return meta.getMetaBypage(page).then(function (result) {
    console.log("dd", page);
    console.log(result);
    if (result !== undefined) {
      meta_info.status = true;
      meta_info.data = result;
      cache.put(key, meta_info);
      return meta_info;
    }
    return meta_info;
    

  });


};