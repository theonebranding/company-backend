import Attendance from "../models/attendanceSchema.js";
import Employee from "../models/employeeSchema.js";
import LateCheckIn from "../models/lateCheckInSchema.js";

// Fetch Current Attendance Status
export const getCurrentStatus = async (req, res) => {
  try {
    const { _id: employeeId } = req.user;
    const today = new Date().toISOString().split("T")[0];

    // Find today's attendance record
    const attendance = await Attendance.findOne({ employee: employeeId, date: today });

    if (!attendance) {
      return res.status(404).json({ message: "No attendance record found for today" });
    }

    const now = new Date();

    // Calculate total working time live
    let liveWorkingTime = 0;
    if (attendance.checkInTime && !attendance.isRecess) {
      liveWorkingTime =
        (attendance.checkOutTime || now) - attendance.checkInTime - (attendance.totalRecessDuration || 0);
    }

    const totalRecessDurationInMilliseconds = attendance.totalRecessDuration || 0;

    // Format time as hours, minutes, and seconds
    const formatTime = (milliseconds) => {
      const totalSeconds = Math.floor(milliseconds / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      return `${hours} hours ${minutes} minutes ${seconds} seconds`;
    };

    // Determine the current status
    let status = "Checked Out";
    if (attendance.checkInTime && !attendance.checkOutTime) {
      status = attendance.isRecess ? "In Recess" : "Checked In";
    }

    // Fetch late check-in information
    const lateCheckIn = attendance.lateCheckIn || false;
    const lateCheckInMinutes = attendance.lateCheckInMinutes || 0;

    // Response
    const response = {
      status,
      checkInTime: attendance.checkInTime || null,
      checkOutTime: attendance.checkOutTime || null,
      recessStartTime: attendance.recessStartTime || null,
      totalRecessDuration: formatTime(totalRecessDurationInMilliseconds),
      liveWorkingTime: formatTime(liveWorkingTime),
      lateCheckIn,
    };

    res.status(200).json({
      message: "Current attendance status fetched successfully",
      data: response,
    });
  } catch (err) {
    res.status(500).json({ message: "Error fetching current status", error: err.message });
  }
};


// Check-In API
// export const checkIn = async (req, res) => {
//     try {
//         const { _id: employeeId, email: employeeEmail } = req.user;
//         const today = new Date().toISOString().split('T')[0];

//         // Prevent multiple check-ins
//         const existingAttendance = await Attendance.findOne({ employee: employeeId, date: today });
//         if (existingAttendance) {
//             return res.status(400).json({ message: 'Already checked in for today' });
//         }

//         const attendance = new Attendance({
//             employee: employeeId,
//             employeeEmail,
//             date: today,
//             checkInTime: new Date(),
//       currentStatus: "Checked In",
//     });

//     await attendance.save();
//     res.status(200).json({ message: "Check-in successful", attendance });
//   } catch (err) {
//     res.status(500).json({ message: "Error during check-in", error: err.message });
//   }
// };


export const checkIn = async (req, res) => {
    try {
        const { _id: employeeId, email: employeeEmail } = req.user;
        const today = new Date().toISOString().split('T')[0];

        // Prevent multiple check-ins
        const existingAttendance = await Attendance.findOne({ employee: employeeId, date: today });
        if (existingAttendance) {
            return res.status(400).json({ message: 'Already checked in for today' });
        }

        // Fetch employee's predefined check-in time
        const employee = await Employee.findById(employeeId);
        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        const predefinedCheckInTime = employee.predefinedCheckInTime;
        // console.log(predefinedCheckInTime);
        const [predefinedHour, predefinedMinute] = predefinedCheckInTime.split(':').map(Number);

        const actualCheckInTime = new Date();
        const predefinedTime = new Date(actualCheckInTime);
        predefinedTime.setHours(predefinedHour, predefinedMinute, 0, 0);

        // Calculate delay
        const delayInMinutes = Math.floor((actualCheckInTime - predefinedTime) / (1000 * 60));
        // console.log(delayInMinutes);
        const isLate = delayInMinutes > 20; // Late if delay exceeds 20 minutes

        // If late, create a record in the LateCheckIn schema
        if (isLate) {
            const lateCheckIn = new LateCheckIn({
                employee: employeeId,
                employeeEmail,
                date: today,
                lateByMinutes: delayInMinutes,
                predefinedCheckInTime,
                actualCheckInTime,
            });

            await lateCheckIn.save();
        }

        // Save attendance record
        const attendance = new Attendance({
            employee: employeeId,
            employeeEmail,
            date: today,
            checkInTime: actualCheckInTime,
            lateCheckIn: isLate,
            currentStatus: 'Checked In',
        });

        await attendance.save();



        res.status(200).json({
            message: 'Check-in successful',
            attendance,
            lateCheckIn: isLate ? `Late by ${delayInMinutes} minutes` : 'On time',
            lateByMinutes: delayInMinutes,
        });
    } catch (err) {
        res.status(500).json({ message: 'Error during check-in', error: err.message });
    }
};


// Start Recess API
export const startRecess = async (req, res) => {
  try {
    const { _id: employeeId } = req.user;
    const today = new Date().toISOString().split("T")[0];

    const attendance = await Attendance.findOne({ employee: employeeId, date: today });
    if (!attendance || !attendance.checkInTime) {
      return res.status(400).json({ message: "Cannot start recess without checking in first" });
    }

    if (attendance.isRecess) {
      return res.status(400).json({ message: "Recess is already ongoing" });
    }

    attendance.isRecess = true;
    attendance.recessStartTime = new Date();
    attendance.currentStatus = "In Recess";

    await attendance.save();
    res.status(200).json({ message: "Recess started", attendance });
  } catch (err) {
    res.status(500).json({ message: "Error during recess start", error: err.message });
  }
};

// End Recess API
export const endRecess = async (req, res) => {
  try {
    const { _id: employeeId } = req.user;
    const today = new Date().toISOString().split("T")[0];

    const attendance = await Attendance.findOne({ employee: employeeId, date: today });
    if (!attendance || !attendance.isRecess) {
      return res.status(400).json({ message: "No ongoing recess to end" });
    }

    const now = new Date();
    const recessDuration = now - new Date(attendance.recessStartTime);

    attendance.totalRecessDuration = (attendance.totalRecessDuration || 0) + recessDuration;
    attendance.isRecess = false;
    attendance.recessStartTime = null;
    attendance.currentStatus = "Checked In";

    await attendance.save();
    res.status(200).json({ message: "Recess ended", attendance });
  } catch (err) {
    res.status(500).json({ message: "Error during recess end", error: err.message });
  }
};

// Check-Out API
export const checkOut = async (req, res) => {
    try {
        const { _id: employeeId } = req.user;
        const today = new Date().toISOString().split("T")[0];

        const attendance = await Attendance.findOne({ employee: employeeId, date: today });
        if (!attendance || !attendance.checkInTime) {
            return res.status(400).json({ message: "Cannot check out without checking in first" });
        }

        if (attendance.isRecess) {
            return res.status(400).json({ message: "Cannot check out during an ongoing recess" });
        }

        attendance.checkOutTime = new Date();
        attendance.currentStatus = "Checked Out";

        // Calculate total working time in minutes
        const totalWorkingTimeInMinutes = Math.floor(
            (attendance.checkOutTime - attendance.checkInTime - (attendance.totalRecessDuration || 0)) / 60000
        );
        attendance.totalWorkingTime = totalWorkingTimeInMinutes; // Save total working time in minutes to database

        await attendance.save();

        // Format total working time as hours and minutes for response
        const hours = Math.floor(totalWorkingTimeInMinutes / 60);
        const minutes = totalWorkingTimeInMinutes % 60;
        const totalWorkingTimeFormatted = `${hours} hours ${minutes} minutes`;

        res.status(200).json({
            message: "Check-out successful",
            attendance,
            totalWorkingTime: totalWorkingTimeFormatted,
        });
    } catch (err) {
        res.status(500).json({ message: "Error during check-out", error: err.message });
    }
};


export const updateAttendance = async (req, res) => {
    try {
        const { attendanceId } = req.params;
        const {
            checkInTime,
            checkOutTime,
            totalRecessDuration,
        } = req.body;

        const attendance = await Attendance.findById(attendanceId);
        if (!attendance) {
            return res.status(404).json({ message: 'Attendance record not found' });
        }

        if (checkInTime) attendance.checkInTime = new Date(checkInTime);
        if (checkOutTime) attendance.checkOutTime = new Date(checkOutTime);
        if (totalRecessDuration) attendance.totalRecessDuration = totalRecessDuration;

        // Recalculate totalWorkingTime if check-out and check-in times exist
        if (attendance.checkOutTime && attendance.checkInTime) {
            attendance.totalWorkingTime = attendance.checkOutTime - attendance.checkInTime - (attendance.totalRecessDuration || 0);
        }

        await attendance.save();

        res.status(200).json({ message: 'Attendance record updated successfully', attendance });
    } catch (err) {
        res.status(500).json({ message: 'Error updating attendance', error: err.message });
    }
};
