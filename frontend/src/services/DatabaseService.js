// src/services/DatabaseService.js
// Database service for storing photos and evaluations in a proper database

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

class DatabaseService {
  constructor() {
    this.token = localStorage.getItem('token');
  }

  // Photo Storage Methods
  async storePhoto(photoData) {
    try {
      const response = await fetch(`${API_URL}/photos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        },
        body: JSON.stringify(photoData)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to store photo');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Photo storage error:', error);
      // Fallback to localStorage if database fails
      return this.storePhotoInLocalStorage(photoData);
    }
  }

  async getPhotos(type = null, limit = 50) {
    try {
      const url = type ? `${API_URL}/photos?type=${type}&limit=${limit}` : `${API_URL}/photos?limit=${limit}`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch photos');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Photo fetch error:', error);
      // Fallback to localStorage
      return this.getPhotosFromLocalStorage(type, limit);
    }
  }

  async deletePhoto(photoId) {
    try {
      const response = await fetch(`${API_URL}/photos/${photoId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete photo');
      }
      
      return true;
    } catch (error) {
      console.error('Photo deletion error:', error);
      // Fallback to localStorage
      return this.deletePhotoFromLocalStorage(photoId);
    }
  }

  // Evaluation Storage Methods
  async storeEvaluation(evaluationData) {
    try {
      const response = await fetch(`${API_URL}/evaluations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        },
        body: JSON.stringify(evaluationData)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to store evaluation');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Evaluation storage error:', error);
      // Fallback to localStorage
      return this.storeEvaluationInLocalStorage(evaluationData);
    }
  }

  async getEvaluations(employeeId = null, evaluationType = null) {
    try {
      let url = `${API_URL}/evaluations`;
      const params = new URLSearchParams();
      
      if (employeeId) params.append('employeeId', employeeId);
      if (evaluationType) params.append('type', evaluationType);
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch evaluations');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Evaluation fetch error:', error);
      // Fallback to localStorage
      return this.getEvaluationsFromLocalStorage(employeeId, evaluationType);
    }
  }

  async updateEvaluation(evaluationId, evaluationData) {
    try {
      const response = await fetch(`${API_URL}/evaluations/${evaluationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        },
        body: JSON.stringify(evaluationData)
      });
      
      if (!response.ok) {
        throw new Error('Failed to update evaluation');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Evaluation update error:', error);
      // Fallback to localStorage
      return this.updateEvaluationInLocalStorage(evaluationId, evaluationData);
    }
  }

  async deleteEvaluation(evaluationId) {
    try {
      const response = await fetch(`${API_URL}/evaluations/${evaluationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete evaluation');
      }
      
      return true;
    } catch (error) {
      console.error('Evaluation deletion error:', error);
      // Fallback to localStorage
      return this.deleteEvaluationFromLocalStorage(evaluationId);
    }
  }

  // Attendance Storage Methods
  async storeAttendance(attendanceData) {
    try {
      const response = await fetch(`${API_URL}/attendance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        },
        body: JSON.stringify(attendanceData)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to store attendance');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Attendance storage error:', error);
      // Fallback to localStorage
      return this.storeAttendanceInLocalStorage(attendanceData);
    }
  }

  async getAttendance(employeeId = null, dateRange = null) {
    try {
      let url = `${API_URL}/attendance`;
      const params = new URLSearchParams();
      
      if (employeeId) params.append('employeeId', employeeId);
      if (dateRange) {
        params.append('startDate', dateRange.start);
        params.append('endDate', dateRange.end);
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch attendance records');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Attendance fetch error:', error);
      // Fallback to localStorage
      return this.getAttendanceFromLocalStorage(employeeId, dateRange);
    }
  }

  // Report Generation Methods
  async generateReport(reportData) {
    try {
      const response = await fetch(`${API_URL}/reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        },
        body: JSON.stringify(reportData)
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate report');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Report generation error:', error);
      // Fallback to localStorage
      return this.storeReportInLocalStorage(reportData);
    }
  }

  async getReports(employeeId = null, reportType = null) {
    try {
      let url = `${API_URL}/reports`;
      const params = new URLSearchParams();
      
      if (employeeId) params.append('employeeId', employeeId);
      if (reportType) params.append('type', reportType);
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch reports');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Report fetch error:', error);
      // Fallback to localStorage
      return this.getReportsFromLocalStorage(employeeId, reportType);
    }
  }

  // LocalStorage Fallback Methods
  storePhotoInLocalStorage(photoData) {
    const existingPhotos = JSON.parse(localStorage.getItem('storedPhotos') || '[]');
    existingPhotos.push(photoData);
    
    // Keep only last 50 photos
    if (existingPhotos.length > 50) {
      existingPhotos.splice(0, existingPhotos.length - 50);
    }
    
    localStorage.setItem('storedPhotos', JSON.stringify(existingPhotos));
    return photoData;
  }

  getPhotosFromLocalStorage(type = null, limit = 50) {
    const photos = JSON.parse(localStorage.getItem('storedPhotos') || '[]');
    let filtered = type ? photos.filter(photo => photo.type === type) : photos;
    return filtered.slice(-limit);
  }

  deletePhotoFromLocalStorage(photoId) {
    const photos = JSON.parse(localStorage.getItem('storedPhotos') || '[]');
    const filtered = photos.filter(photo => photo.id !== photoId);
    localStorage.setItem('storedPhotos', JSON.stringify(filtered));
    return true;
  }

  storeEvaluationInLocalStorage(evaluationData) {
    const evaluations = JSON.parse(localStorage.getItem('evaluationReports') || '[]');
    evaluations.push(evaluationData);
    localStorage.setItem('evaluationReports', JSON.stringify(evaluations));
    return evaluationData;
  }

  getEvaluationsFromLocalStorage(employeeId = null, evaluationType = null) {
    const evaluations = JSON.parse(localStorage.getItem('evaluationReports') || '[]');
    let filtered = evaluations;
    
   if (employeeId) {
  filtered = filtered.filter(evaluation => evaluation.employeeId === employeeId);
}

if (evaluationType) {
  filtered = filtered.filter(evaluation => evaluation.evaluationType === evaluationType);
}
    
    return filtered;
  }

  updateEvaluationInLocalStorage(evaluationId, evaluationData) {
    const evaluations = JSON.parse(localStorage.getItem('evaluationReports') || '[]');
    const index = evaluations.findIndex(evaluation => evaluation.id === evaluationId);
    
    if (index !== -1) {
      evaluations[index] = { ...evaluations[index], ...evaluationData };
      localStorage.setItem('evaluationReports', JSON.stringify(evaluations));
      return evaluations[index];
    }
    
    return null;
  }

  deleteEvaluationFromLocalStorage(evaluationId) {
    const evaluations = JSON.parse(localStorage.getItem('evaluationReports') || '[]');
  const filtered = evaluations.filter(evaluation => evaluation.id !== evaluationId);
    localStorage.setItem('evaluationReports', JSON.stringify(filtered));
    return true;
  }

  storeAttendanceInLocalStorage(attendanceData) {
    const attendance = JSON.parse(localStorage.getItem('attendanceRecords') || '[]');
    attendance.push(attendanceData);
    localStorage.setItem('attendanceRecords', JSON.stringify(attendance));
    return attendanceData;
  }

  getAttendanceFromLocalStorage(employeeId = null, dateRange = null) {
    const attendance = JSON.parse(localStorage.getItem('attendanceRecords') || '[]');
    let filtered = attendance;
    
    if (employeeId) {
      filtered = filtered.filter(record => record.employeeId === employeeId);
    }
    
    if (dateRange) {
      const start = new Date(dateRange.start);
      const end = new Date(dateRange.end);
      filtered = filtered.filter(record => {
        const recordDate = new Date(record.timestamp);
        return recordDate >= start && recordDate <= end;
      });
    }
    
    return filtered;
  }

  storeReportInLocalStorage(reportData) {
    const reports = JSON.parse(localStorage.getItem('generatedReports') || '[]');
    reports.push(reportData);
    localStorage.setItem('generatedReports', JSON.stringify(reports));
    return reportData;
  }

  getReportsFromLocalStorage(employeeId = null, reportType = null) {
    const reports = JSON.parse(localStorage.getItem('generatedReports') || '[]');
    let filtered = reports;
    
    if (employeeId) {
      filtered = filtered.filter(report => report.employeeId === employeeId);
    }
    
    if (reportType) {
      filtered = filtered.filter(report => report.reportType === reportType);
    }
    
    return filtered;
  }

  // Utility Methods
  updateToken(token) {
    this.token = token;
    localStorage.setItem('token', token);
  }

  clearAllData() {
    localStorage.removeItem('storedPhotos');
    localStorage.removeItem('evaluationReports');
    localStorage.removeItem('attendanceRecords');
    localStorage.removeItem('generatedReports');
  }

  // Sync Methods
  async syncWithDatabase() {
    try {
      // Sync photos
      const localPhotos = this.getPhotosFromLocalStorage();
      for (const photo of localPhotos) {
        if (!photo.synced) {
          await this.storePhoto(photo);
          photo.synced = true;
        }
      }
      
      // Sync evaluations
      const localEvaluations = this.getEvaluationsFromLocalStorage();
      for (const evaluation of localEvaluations) {
        if (!evaluation.synced) {
          await this.storeEvaluation(evaluation);
          evaluation.synced = true;
        }
      }
      
      // Sync attendance
      const localAttendance = this.getAttendanceFromLocalStorage();
      for (const attendance of localAttendance) {
        if (!attendance.synced) {
          await this.storeAttendance(attendance);
          attendance.synced = true;
        }
      }
      
      return { success: true, message: 'Data synced successfully' };
    } catch (error) {
      console.error('Sync error:', error);
      return { success: false, error: error.message };
    }
  }
}

// Create singleton instance
const databaseService = new DatabaseService();

export default databaseService;
