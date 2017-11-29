/* global db print */
const cursor = db.EntityRessource.find()
let r, data
while (cursor.hasNext()) {
  r = cursor.next()
  data = JSON.parse(r._data)
  if (!data.resume || !data.commentaires) {
    print((data.resume ? '' : r._id) + '\t' + (data.commentaires ? '' : r._id))
  }
}
