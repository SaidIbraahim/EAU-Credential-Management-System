  },

  // New method: Get all students for validation (only essential fields)
  async getAllForValidation(req: Request, res: Response): Promise<Response> {
    try {
      const students = await prisma.student.findMany({
        select: {
          id: true,
          registrationId: true,
          certificateId: true,
          fullName: true,
          departmentId: true,
          facultyId: true,
          academicYearId: true,
          status: true
        },
        orderBy: {
          registrationId: 'asc'
        }
      });

      console.log(`📊 Fetched ${students.length} students for validation`);

      return res.json({
        data: students,
        total: students.length
      });
    } catch (error) {
      console.error('Error fetching students for validation:', error);
      return res.status(500).json({ error: 'Failed to fetch students for validation' });
    }
  },

  // New method: Get all students for validation (only essential fields)

->

  },

  // New method: Get all students for validation (only essential fields) 