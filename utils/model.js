const Pool = require('pg').Pool

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'api_test',
  password: 'root',
  port: 5432,
})

class Model {
  constructor(table) {
    this.pool = pool;
    this.table = table;
    this.pool.on('error', (err, client) => `Error, ${err}, on idle client${client}`);
  }

  async select(columns, clause) {
    let query = `SELECT ${columns} FROM ${this.table}`;
    if (clause) query += clause;
    return this.pool.query(query);
  }

  async registerUser(params){		
		try {
			const userexist = await this.pool.query(`SELECT "id","username" FROM "user" WHERE LOWER("username") = $1`, [params.username]);
			console.log(userexist);return 1;
			if(userexist.length){
				console.log('User exists'); return 1;
			};
			return 0;
			//return await this.pool.query("INSERT INTO user (`username`,`password`,`online`) VALUES (?,?,?)", [params['username'],params['password'],'Y']);
		} catch (error) {
			console.error(error);
			return null;
		}
	}
  async loginUser(params){
		try {
			return await this.pool.query(`SELECT id,username FROM user WHERE LOWER(username) = ? AND password = ?`, [params.username,params.password]);
		} catch (error) {
			return null;
		}
	}

  async userSessionCheck(userId){
		try {
			const result = await this.pool.query(`SELECT online,username FROM user WHERE id = ? AND online = ?`, [userId,'Y']);
			if(result !== null){
				return result[0]['username'];
			}else{
				return null;
			}
		} catch (error) {
			return null;
		}
	}


  async addSocketId(userId, userSocketId){
		try {      
      return await this.pool.query(`UPDATE "user" SET "socketid" = $1, "online" = $2 WHERE "id" = $3`, [userSocketId,'Y',userId]);
		} catch (error) {
			console.log(error);
			return null;
		}
	}
  async isUserLoggedOut(userSocketId){
		try {
			return await this.db.query(`SELECT online FROM user WHERE socketid = ?`, [userSocketId]);
		} catch (error) {
			return null;
		}
	}

  async logoutUser(userSocketId){
		return await this.db.query(`UPDATE user SET socketid = ?, online= ? WHERE socketid = ?`, ['','N',userSocketId]);
	}



	getChatList(userId, userSocketId){
		try {
			return Promise.all([
				this.pool.query(`SELECT id,username,online,socketid FROM user WHERE id = ?`, [userId]),
				this.pool.query(`SELECT id,username,online,socketid FROM user WHERE online = ? and socketid != ?`, ['Y',userSocketId])
			]).then( (response) => {
				return {
					userinfo : response[0].length > 0 ? response[0][0] : response[0],
					chatlist : response[1]
				};
			}).catch( (error) => {
				console.warn(error);
				return (null);
			});
		} catch (error) {
			console.warn(error);
			return null;
		}
	}



	a
	async insertMessages(params){
		try {
			return await this.db.query(
				"INSERT INTO message (`from_user_id`,`to_user_id`,`message`) values (?,?,?)",
				[params.fromUserId, params.toUserId, params.message]
			);
		} catch (error) {
			console.warn(error);
			return null;
		}		
	}

	async getMessages(userId, toUserId){
		try {
			return await this.pool.query(
				`SELECT id,from_user_id as fromUserId,to_user_id as toUserId,message FROM message WHERE 
					(from_user_id = ? AND to_user_id = ? )
					OR
					(from_user_id = ? AND to_user_id = ? )	ORDER BY id ASC				
				`,
				[userId, toUserId, toUserId, userId]
			);
		} catch (error) {
			console.warn(error);
			return null;
		}
	}
}

module.exports = new Model();
