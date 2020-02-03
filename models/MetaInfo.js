const mysql = require('mysql');

const db = require('../db');

class MeatInfo {
  getMetaBypage(page) {
    return new Promise((resolve, reject) => {
      db.query(
        "SELECT * FROM `meta_info` WHERE `page_path` = ?",
        [page],
        (err, result) => {
          return err ? reject(err) : resolve(result[0]);
        }
      );
    });
    //db.end();
  }

  getMetaById(id) {
    return new Promise((resolve, reject) => {
      db.query(
        "SELECT * FROM `meta_info` WHERE `id` = ?",
        [id],
        (err, result) => {
          return err ? reject(err) : resolve(result[0]);
        }
      );
    });
    //db.end();
  }

  getMetaAllpage() {
    let rows = [];
    return new Promise((resolve, reject) => {
      db.query(
        "SELECT page_path as page FROM `meta_info`",
        (err, results) => {
          results.forEach(element => {
            rows.push(element.page);
          });
          return err ? reject(err) : resolve(rows);
        }
      );
    });
    //db.end();
  }

  insertMeta(data) {
    return new Promise((resolve, reject) => {
      db.query(
        "INSERT INTO meta_info SET ?",
        data,
        (err, result) => {
          return err ? reject(err) : resolve(result[0]);
        }
      );
      //console.log(query.sql);
    });
    //db.end();
  }

  updateMeta(key, data) {
    return new Promise((resolve, reject) => {
      let query = "UPDATE meta_info SET title= ?, keyword=?, meta_info=? WHERE page_path = ?";
      db.query(
        query,
        [data.title, data.keyword, data.meta_info, key],
        (err, result) => {
          console.log(result);
          return err ? reject(err) : resolve(result.changedRows);
        }
      );
    });
    //db.end();
  }

  deleteMeta(key) {
    return new Promise((resolve, reject) => {
      let query = "Delete FROM meta_info WHERE id= ?";
      db.query(
        query,
        [key],
        (err, result) => {
         
          return err ? reject(err) : resolve(result.affectedRows);
        }
      );
    });
    //db.end();
  }


}

module.exports = MeatInfo;
