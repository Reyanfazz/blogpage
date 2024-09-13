const sql = require('mssql');



class User {
    constructor({ displayname, user_email, user_pass, user_activation_key, user_nicename, user_profileUrl, user_isAdmin, user_status, user_createdAt }) {
        this.displayname = displayname;
        this.user_email = user_email;
        this.user_pass = user_pass;
        this.user_activation_key = user_activation_key;
        this.user_nicename = user_nicename;
        this.user_profileUrl = user_profileUrl;
        this.user_isAdmin = user_isAdmin;
        this.user_status = user_status;
        this.user_createdAt = user_createdAt;
    }

    // Create a new user
    static async create(userData) {
        try {
            console.log('Creating user:', userData); // Log userData for debugging
            const pool = await sql.connect(config);
            const request = pool.request();

            // Declare scalar variables
            request.input('displayname', sql.NVarChar, userData.displayname);
            request.input('user_email', sql.NVarChar, userData.user_email);
            request.input('user_pass', sql.NVarChar, userData.user_pass);
            request.input('user_activation_key', sql.NVarChar, userData.user_activation_key);
            request.input('user_nicename', sql.NVarChar, userData.user_nicename);
            request.input('user_profileUrl', sql.NVarChar, userData.user_profileUrl);
            request.input('user_isAdmin', sql.Bit, userData.user_isAdmin);
            request.input('user_status', sql.Int, userData.user_status);
            request.input('user_createdAt', sql.DateTime, userData.user_createdAt);

            // Insert the new user record into the database
            const result = await request.query(`
            INSERT INTO Kme_Blog (displayname, user_email, user_pass, user_activation_key, user_nicename, user_profileUrl, user_isAdmin, user_status, user_createdAt)
            VALUES (@displayname, @user_email, @user_pass, @user_activation_key, @user_nicename, @user_profileUrl, @user_isAdmin, @user_status, @user_createdAt);
        `);

            await pool.close();
            return userData;
        } catch (error) {
            console.error('Error creating user:', error); // Log error for debugging
            throw error;
        }
    }

    // Save or update user data
    async save() {
        try {
            const pool = await sql.connect(config);
            const request = pool.request();
            request.input('user_email', sql.NVarChar, this.user_email);
            request.input('displayname', sql.NVarChar, this.displayname);
            request.input('user_pass', sql.NVarChar, this.user_pass);
            request.input('user_activation_key', sql.NVarChar, this.user_activation_key);
            request.input('user_nicename', sql.NVarChar, this.user_nicename);
            request.input('user_profileUrl', sql.NVarChar, this.user_profileUrl);
            request.input('user_isAdmin', sql.Bit, this.user_isAdmin);
            request.input('user_status', sql.Int, this.user_status);
            request.input('user_createdAt', sql.DateTime, this.user_createdAt);

            // Execute SQL query to update user data
            const result = await request.query(`
            UPDATE Kme_Blog
            SET displayname = @displayname, 
                user_pass = @user_pass,
                user_activation_key = @user_activation_key,
                user_nicename = @user_nicename,
                user_profileUrl = @user_profileUrl,
                user_isAdmin = @user_isAdmin,
                user_status = @user_status,
                user_createdAt = @user_createdAt
            WHERE user_email = @user_email;
        `);

            await pool.close();
            return result;
        } catch (error) {
            console.error('Error saving user:', error);
            throw error;
        }
    }

    // Find a user by email
    static async findByEmail(email) {
        try {
            const pool = await sql.connect(config);
            const request = pool.request();
            request.input('email', sql.VarChar, email);
            const result = await request.query(`SELECT * FROM Kme_Blog WHERE user_email = @email;`);
            await pool.close();
            return result.recordset.length > 0 ? result.recordset[0] : null;
        } catch (error) {
            console.error('Error finding user by email:', error); // Log error for debugging
            throw error;
        }
    }
}

module.exports = User;
