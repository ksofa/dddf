const { db } = require('../src/config/firebase');

async function checkApplications() {
  try {
    console.log('Checking applications in database...');
    const snapshot = await db.collection('applications').get();
    console.log('Total applications found:', snapshot.size);
    
    snapshot.forEach(doc => {
      const data = doc.data();
      console.log('Application:', {
        id: doc.id,
        type: data.type,
        status: data.status,
        senderId: data.senderId,
        receiverId: data.receiverId,
        title: data.title || data.projectTitle,
        createdAt: data.createdAt?.toDate?.() || data.createdAt
      });
    });
  } catch (error) {
    console.error('Error:', error);
  }
}

checkApplications(); 