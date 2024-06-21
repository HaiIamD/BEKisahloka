const db = require('../mysqlConnection.js');

const addCerita = async (req, res) => {
  try {
    const { titleCerita, imageCerita, descCerita, creatorId, jenisCerita, asalDaerah, isiCerita, genre } = req.body;
    const insertUserQuery = 'INSERT INTO cerita (titleCerita,imageCerita,descCerita,jenisCerita, asalDaerah,creatorId) VALUES (?,?,?,?,?,?)';
    const CeritaResult = await db.query(insertUserQuery, [titleCerita, imageCerita, descCerita, jenisCerita, asalDaerah, creatorId]);

    // id dari Cerita yang baru saja di buat
    const ceritaId = CeritaResult[0].insertId;

    let isiCeritaArray = [];
    let genreArray = [];

    for (const item of isiCerita) {
      const { imageisicerita, cerita_Indonesia, cerita_English } = item;
      const insertIsiCeritaQuery = 'INSERT INTO isicerita (ceritaId,imageisicerita,cerita_Indonesia, cerita_English) VALUES (?, ?, ?, ?)';
      const IsiCeritaResult = await db.query(insertIsiCeritaQuery, [ceritaId, imageisicerita, cerita_Indonesia, cerita_English]);
      isiCeritaArray.push({ imageisicerita, cerita_Indonesia, cerita_English });
    }
    for (const item of genre) {
      const { genre } = item;
      const insertGenreQuery = 'INSERT INTO genre (ceritaId,genre) VALUES (?, ?)';
      const IsiGenreResult = await db.query(insertGenreQuery, [ceritaId, genre]);
      genreArray.push({ genre });
    }

    const hasilCerita = {
      id: ceritaId,
      titleCerita,
      imageCerita,
      descCerita,
      jenisCerita,
      asalDaerah,
      creatorId,
      isiCerita: isiCeritaArray,
      genre: genreArray,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    res.status(200).json(hasilCerita);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Sorry, something went wrong on the server' });
  }
};

const getCeritaById = async (req, res) => {
  try {
    const { ceritaId } = req.params;

    const query = `
      SELECT cerita.*,  
        GROUP_CONCAT(DISTINCT JSON_OBJECT('genre', genre.genre)) AS genre,
        GROUP_CONCAT(DISTINCT JSON_OBJECT('favorite', favorite.userId)) AS favorite
      FROM cerita  
      JOIN isicerita ON cerita.id = isicerita.ceritaId 
      JOIN genre ON cerita.id = genre.ceritaId 
      LEFT JOIN favorite ON cerita.id = favorite.ceritaId 
      WHERE cerita.id = ?
      GROUP BY cerita.id
    `;

    const isiceritaQuery = `
      SELECT imageisicerita, cerita_Indonesia, cerita_English
      FROM isicerita
      WHERE ceritaId = ?
    `;
    const [isiceritaResults] = await db.query(isiceritaQuery, [ceritaId]);
    const isiCerita = isiceritaResults.map((row) => ({
      imageisicerita: row.imageisicerita,
      cerita_Indonesia: row.cerita_Indonesia,
      cerita_English: row.cerita_English,
    }));

    const [hasilQuery] = await db.query(query, [ceritaId]);

    if (!hasilQuery || !hasilQuery.length) {
      return res.status(404).json({ error: 'Cerita not found' });
    }

    const result = hasilQuery[0];

    const finalResult = {
      ceritaId: result.id,
      titleCerita: result.titleCerita,
      imageCerita: result.imageCerita,
      descCerita: result.descCerita,
      jenisCerita: result.jenisCerita,
      asalDaerah: result.asalDaerah,
      creatorId: result.creatorId,
      isiCerita: isiCerita,
      genre: result.genre ? JSON.parse(`[${result.genre}]`) : [],
      favorite: result.favorite ? JSON.parse(`[${result.favorite}]`) : [],
      created_at: result.created_at,
      update_at: result.update_at,
    };

    res.status(200).json(finalResult);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Sorry, something went wrong on the server' });
  }
};

const getAllCerita = async (req, res) => {
  try {
    const { limit = 12, offset = 0, search } = req.query;
    const limitRecords = parseInt(limit);
    const offsetRecords = parseInt(offset);
    const query = `
      SELECT cerita.*, 
        GROUP_CONCAT(DISTINCT CONCAT(
          '{"imageisicerita": "', isicerita.imageisicerita, '", 
          "cerita_Indonesia": "', isicerita.cerita_Indonesia, '", 
          "cerita_English": "', isicerita.cerita_English, '"}'
        )) AS isiCerita, 
        GROUP_CONCAT(DISTINCT JSON_OBJECT('genre', genre.genre)) AS genre,
        GROUP_CONCAT(DISTINCT JSON_OBJECT('favorite', favorite.userId)) AS favorite
      FROM cerita  
      JOIN isicerita ON cerita.id = isicerita.ceritaId 
      JOIN genre ON cerita.id = genre.ceritaId  
      LEFT JOIN favorite ON cerita.id = favorite.ceritaId  
      ${search !== undefined ? 'WHERE cerita.titleCerita LIKE ?' : ''}
      GROUP BY cerita.id LIMIT ? OFFSET ?
    `;

    const queryParams = search !== undefined ? [`%${search}%`, limitRecords, offsetRecords] : [limitRecords, offsetRecords];
    const [hasilQuery] = await db.query(query, queryParams);

    const finalResults = hasilQuery.map((result) => ({
      ceritaId: result.id,
      titleCerita: result.titleCerita,
      imageCerita: result.imageCerita,
      jenisCerita: result.jenisCerita,
      asalDaerah: result.asalDaerah,
      genre: result.genre ? JSON.parse(`[${result.genre}]`) : [],
      favorite: result.favorite ? JSON.parse(`[${result.favorite}]`) : [],
    }));

    res.status(200).json(finalResults);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Sorry, something went wrong on the server' });
  }
};

const getAllCeritaFilter = async (req, res) => {
  try {
    const { limit = 100, offset = 0, genre, jenisCerita, asalDaerah, search } = req.query;
    const limitRecords = parseInt(limit);
    const offsetRecords = parseInt(offset);

    let query = `SELECT cerita.*, 
      GROUP_CONCAT(DISTINCT CONCAT(
        '{"imageisicerita": "', isicerita.imageisicerita, '", 
        "cerita_Indonesia": "', isicerita.cerita_Indonesia, '", 
        "cerita_English": "', isicerita.cerita_English, '"}'
      )) AS isiCerita, 
      GROUP_CONCAT(DISTINCT JSON_OBJECT('genre', genre.genre)) AS genre,
      GROUP_CONCAT(DISTINCT JSON_OBJECT('favorite', favorite.userId)) AS favorite
      FROM cerita 
      JOIN isicerita ON cerita.id = isicerita.ceritaId 
      JOIN genre ON cerita.id = genre.ceritaId
      LEFT JOIN favorite ON cerita.id = favorite.ceritaId`;

    let conditions = [];
    let params = [];

    // Tambahkan kondisi search jika ada
    if (search) {
      conditions.push('cerita.titleCerita LIKE ?');
      params.push(`%${search}%`);
    }

    // Tambahkan kondisi filter lainnya
    if (jenisCerita) {
      conditions.push('cerita.jenisCerita LIKE ?');
      params.push(`%${jenisCerita}%`);
    }
    if (asalDaerah) {
      conditions.push('cerita.asalDaerah LIKE ?');
      params.push(`%${asalDaerah}%`);
    }
    if (genre) {
      conditions.push('cerita.id IN (SELECT ceritaId FROM genre WHERE genre LIKE ?)');
      params.push(`%${genre}%`);
    }

    // Gabungkan semua kondisi dengan 'AND' jika ada
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    // Tambahkan GROUP BY, LIMIT, dan OFFSET
    query += ' GROUP BY cerita.id LIMIT ? OFFSET ?';
    params.push(limitRecords, offsetRecords);

    // Jalankan query utama
    const [hasilQuery] = await db.query(query, params);

    // Format hasil query
    const finalResults = hasilQuery.map((result) => ({
      ceritaId: result.id,
      titleCerita: result.titleCerita,
      imageCerita: result.imageCerita,
      jenisCerita: result.jenisCerita,
      asalDaerah: result.asalDaerah,
      genre: result.genre ? JSON.parse(`[${result.genre}]`) : [],
      favorite: result.favorite ? JSON.parse(`[${result.favorite}]`) : [],
    }));

    // Kirimkan hasil dengan jumlah total yang sesuai
    if (jenisCerita || asalDaerah || genre || search || offset) {
      res.status(200).json({ Data: finalResults });
    } else {
      res.status(200).json({ Data: finalResults });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Maaf, terjadi kesalahan pada server' });
  }
};

const addFavorite = async (req, res) => {
  try {
    const { userId, ceritaId } = req.body;

    const check = 'SELECT * FROM favorite WHERE ceritaId = ? AND userId = ?';
    const [queryCheck] = await db.query(check, [ceritaId, userId]);

    if (queryCheck.length > 0) {
      res.status(200).json('Already in Favorite');
    } else {
      const insertFavorite = 'INSERT INTO favorite (ceritaId,userId) VALUES (?,?)';
      const hasilInsertFavorite = await db.query(insertFavorite, [ceritaId, userId]);

      const query =
        'SELECT cerita.*, GROUP_CONCAT(DISTINCT CONCAT(\'{"imageisicerita": "\', isicerita.imageisicerita, \'", "cerita_Indonesia": "\', isicerita.cerita_Indonesia, \'", "cerita_English": "\', isicerita.cerita_English, \'"}\')) as isiCerita, GROUP_CONCAT(DISTINCT JSON_OBJECT(\'genre\', genre.genre)) AS genre  FROM favorite JOIN cerita ON favorite.ceritaId = cerita.id JOIN isicerita ON favorite.ceritaId = isicerita.ceritaId JOIN genre ON favorite.ceritaId = genre.ceritaId WHERE favorite.id = ? GROUP BY cerita.id';
      const [hasilQuery] = await db.query(query, [hasilInsertFavorite[0].insertId]);

      const finalResults = hasilQuery.map((result) => ({
        ceritaId: result.id,
        titleCerita: result.titleCerita,
        imageCerita: result.imageCerita,
        descCerita: result.descCerita,
        creatorId: result.creatorId,
        asalDaerah: result.asalDaerah,
        genre: JSON.parse(`[${result.genre}]`),
      }));

      res.status(200).json(finalResults[0]);
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Sorry, something went wrong on the server' });
  }
};

const getFavoriteCerita = async (req, res) => {
  try {
    const { userId } = req.body;
    const query =
      'SELECT cerita.*, GROUP_CONCAT(DISTINCT CONCAT(\'{"imageisicerita": "\', isicerita.imageisicerita, \'", "cerita_Indonesia": "\', isicerita.cerita_Indonesia, \'", "cerita_English": "\', isicerita.cerita_English, \'"}\')) as isiCerita, GROUP_CONCAT(DISTINCT JSON_OBJECT(\'genre\', genre.genre)) AS genre  FROM favorite JOIN cerita ON favorite.ceritaId = cerita.id JOIN isicerita ON favorite.ceritaId = isicerita.ceritaId JOIN genre ON favorite.ceritaId = genre.ceritaId WHERE favorite.userId = ? GROUP BY cerita.id ORDER BY favorite.created_at DESC  LIMIT 10';
    const [hasilQuery] = await db.query(query, [userId]);

    const finalResults = hasilQuery.map((result) => ({
      ceritaId: result.id,
      titleCerita: result.titleCerita,
      imageCerita: result.imageCerita,
      descCerita: result.descCerita,
      creatorId: result.creatorId,
      asalDaerah: result.asalDaerah,
      genre: JSON.parse(`[${result.genre}]`),
    }));

    res.status(200).json(finalResults);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Sorry, something went wrong on the server' });
  }
};

const deleteFavorite = async (req, res) => {
  try {
    const { userId, ceritaId } = req.body;

    const check = 'SELECT * FROM favorite WHERE ceritaId = ? AND userId = ?';
    const [queryCheck] = await db.query(check, [ceritaId, userId]);

    if (queryCheck.length === 0) {
      res.status(200).json('Favorite does not exist');
    } else {
      const deleteFavoriteQuery = 'DELETE FROM favorite WHERE ceritaId = ? AND userId = ?';
      await db.query(deleteFavoriteQuery, [ceritaId, userId]);
      res.status(200).json('Favorite deleted successfully');
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Sorry, something went wrong on the server' });
  }
};

const addHistory = async (req, res) => {
  try {
    const { userId, ceritaId } = req.body;
    // Check Already add or not
    const check = 'SELECT * FROM historybaca WHERE ceritaId = ? AND userId = ?';
    const [queryCheck] = await db.query(check, [ceritaId, userId]);

    if (queryCheck.length > 0) {
      // Jika sudah ada, lakukan update pada kolom updated_at
      const updateQuery = 'UPDATE historybaca SET update_at = CURRENT_TIMESTAMP WHERE ceritaId = ? AND userId = ?';
      await db.query(updateQuery, [ceritaId, userId]);
      res.status(200).json('Successfully updated history');
    } else {
      // Jika belum ada, tambahkan entri baru
      const insertHistory = 'INSERT INTO historybaca (ceritaId, userId) VALUES (?, ?)';
      await db.query(insertHistory, [ceritaId, userId]);
      res.status(200).json('Successfully added to history');
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Sorry, something went wrong on the server' });
  }
};

const getHistory = async (req, res) => {
  try {
    const { userId } = req.body;
    const query =
      'SELECT cerita.*, GROUP_CONCAT(DISTINCT CONCAT(\'{"imageisicerita": "\', isicerita.imageisicerita, \'", "cerita_Indonesia": "\', isicerita.cerita_Indonesia, \'", "cerita_English": "\', isicerita.cerita_English, \'"}\')) as isiCerita, GROUP_CONCAT(DISTINCT JSON_OBJECT(\'genre\', genre.genre)) AS genre  FROM historybaca JOIN cerita ON historybaca.ceritaId = cerita.id JOIN isicerita ON historybaca.ceritaId = isicerita.ceritaId JOIN genre ON historybaca.ceritaId = genre.ceritaId WHERE historybaca.userId = ? GROUP BY cerita.id LIMIT 10';
    const [hasilQuery] = await db.query(query, [userId]);

    const finalResults = hasilQuery.map((result) => ({
      ceritaId: result.id,
      titleCerita: result.titleCerita,
      imageCerita: result.imageCerita,
      descCerita: result.descCerita,
      creatorId: result.creatorId,
      isiCerita: JSON.parse(`[${result.isiCerita}]`),
      genre: JSON.parse(`[${result.genre}]`),
      created_at: result.created_at,
      update_at: result.update_at,
    }));

    res.status(200).json(finalResults);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Sorry, something went wrong on the server' });
  }
};

module.exports = { addCerita, addFavorite, getFavoriteCerita, getAllCerita, getAllCeritaFilter, addHistory, getHistory, getCeritaById, deleteFavorite };
