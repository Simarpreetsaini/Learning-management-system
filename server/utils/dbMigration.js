const mongoose = require('mongoose');

/**
 * Database migration utility to fix academic marks indexes
 * This script removes the old index and ensures the correct one exists
 */
class DatabaseMigration {
    constructor() {
        this.collectionName = 'academicmarks';
    }

    /**
     * Fix academic marks indexes
     */
    async fixAcademicMarksIndexes() {
        try {
            console.log('🔧 Starting academic marks index migration...');
            
            const db = mongoose.connection.db;
            const collection = db.collection(this.collectionName);
            
            // Get existing indexes
            const existingIndexes = await collection.indexes();
            console.log('📋 Current indexes:', existingIndexes.map(idx => ({ name: idx.name, key: idx.key })));
            
            // Check for old problematic index
            const oldIndexName = 'student_1_subject_1_semester_1';
            const hasOldIndex = existingIndexes.some(idx => idx.name === oldIndexName);
            
            if (hasOldIndex) {
                console.log(`🗑️  Removing old index: ${oldIndexName}`);
                await collection.dropIndex(oldIndexName);
                console.log('✅ Old index removed successfully');
            } else {
                console.log('ℹ️  Old index not found, skipping removal');
            }
            
            // Ensure the correct index exists
            const correctIndexName = 'student_1_subject_1_semester_1_examType_1';
            const hasCorrectIndex = existingIndexes.some(idx => idx.name === correctIndexName);
            
            if (!hasCorrectIndex) {
                console.log('🔨 Creating correct index with examType...');
                await collection.createIndex(
                    { student: 1, subject: 1, semester: 1, examType: 1 },
                    { 
                        unique: true, 
                        name: correctIndexName,
                        background: true 
                    }
                );
                console.log('✅ Correct index created successfully');
            } else {
                console.log('ℹ️  Correct index already exists');
            }
            
            // Verify final state
            const finalIndexes = await collection.indexes();
            console.log('📋 Final indexes:', finalIndexes.map(idx => ({ name: idx.name, key: idx.key })));
            
            console.log('🎉 Academic marks index migration completed successfully!');
            return { success: true, message: 'Index migration completed' };
            
        } catch (error) {
            console.error('❌ Error during index migration:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Check for duplicate records that might cause issues
     */
    async checkForDuplicates() {
        try {
            console.log('🔍 Checking for potential duplicate records...');
            
            const db = mongoose.connection.db;
            const collection = db.collection(this.collectionName);
            
            // Aggregate to find duplicates based on student, subject, semester (without examType)
            const duplicates = await collection.aggregate([
                {
                    $group: {
                        _id: {
                            student: '$student',
                            subject: '$subject',
                            semester: '$semester'
                        },
                        count: { $sum: 1 },
                        docs: { $push: { _id: '$_id', examType: '$examType' } }
                    }
                },
                {
                    $match: { count: { $gt: 1 } }
                }
            ]).toArray();
            
            if (duplicates.length > 0) {
                console.log(`⚠️  Found ${duplicates.length} groups with multiple records:`);
                duplicates.forEach((dup, index) => {
                    console.log(`   ${index + 1}. Student: ${dup._id.student}, Subject: ${dup._id.subject}, Semester: ${dup._id.semester}`);
                    console.log(`      Records: ${dup.docs.map(doc => `${doc._id} (${doc.examType || 'no examType'})`).join(', ')}`);
                });
                
                return { 
                    success: true, 
                    hasDuplicates: true, 
                    duplicates: duplicates.length,
                    details: duplicates 
                };
            } else {
                console.log('✅ No duplicate records found');
                return { success: true, hasDuplicates: false, duplicates: 0 };
            }
            
        } catch (error) {
            console.error('❌ Error checking for duplicates:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Run complete migration process
     */
    async runMigration() {
        try {
            console.log('🚀 Starting complete academic marks migration...');
            
            // Check current state
            const duplicateCheck = await this.checkForDuplicates();
            
            // Fix indexes
            const indexFix = await this.fixAcademicMarksIndexes();
            
            if (!indexFix.success) {
                throw new Error(`Index migration failed: ${indexFix.error}`);
            }
            
            console.log('🎉 Migration completed successfully!');
            return {
                success: true,
                duplicateCheck,
                indexFix
            };
            
        } catch (error) {
            console.error('❌ Migration failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

module.exports = DatabaseMigration;
