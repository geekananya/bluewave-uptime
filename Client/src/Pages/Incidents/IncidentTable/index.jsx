import PropTypes from "prop-types";
import {
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Pagination,
  PaginationItem,
  Paper,
  Typography,
  Box,
} from "@mui/material";

import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";

import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { networkService } from "../../../main";
import { StatusLabel } from "../../../Components/Label";
import { logger } from "../../../Utils/Logger";
import { useTheme } from "@emotion/react";

const IncidentTable = ({ monitors, selectedMonitor, filter }) => {
  const theme = useTheme();
  const { authToken, user } = useSelector((state) => state.auth);
  const [checks, setChecks] = useState([]);
  const [checksCount, setChecksCount] = useState(0);
  const [paginationController, setPaginationController] = useState({
    page: 0,
    rowsPerPage: 14,
  });

  useEffect(() => {
    setPaginationController((prevPaginationController) => ({
      ...prevPaginationController,
      page: 0,
    }));
  }, [filter, selectedMonitor]);

  useEffect(() => {
    const fetchPage = async () => {
      if (!monitors || Object.keys(monitors).length === 0) {
        return;
      }
      try {
        let res;
        if (selectedMonitor === "0") {
          res = await networkService.getChecksByTeam(
            authToken,
            user.teamId,
            "desc",
            null,
            null,
            filter,
            paginationController.page,
            paginationController.rowsPerPage
          );
        } else {
          res = await networkService.getChecksByMonitor(
            authToken,
            selectedMonitor,
            "desc",
            null,
            null,
            filter,
            paginationController.page,
            paginationController.rowsPerPage
          );
        }
        setChecks(res.data.data.checks);
        setChecksCount(res.data.data.checksCount);
      } catch (error) {
        logger.error(error);
      }
    };
    fetchPage();
  }, [
    authToken,
    user,
    monitors,
    selectedMonitor,
    filter,
    paginationController.page,
    paginationController.rowsPerPage,
  ]);

  const handlePageChange = (_, newPage) => {
    setPaginationController({
      ...paginationController,
      page: newPage - 1, // 0-indexed
    });
  };

  let paginationComponent = <></>;
  if (checksCount > paginationController.rowsPerPage) {
    paginationComponent = (
      <Pagination
        count={Math.ceil(checksCount / paginationController.rowsPerPage)}
        page={paginationController.page + 1} //0-indexed
        onChange={handlePageChange}
        shape="rounded"
        renderItem={(item) => (
          <PaginationItem
            slots={{
              previous: ArrowBackRoundedIcon,
              next: ArrowForwardRoundedIcon,
            }}
            {...item}
          />
        )}
      />
    );
  }

  let sharedStyles = {
    border: 1,
    borderColor: theme.palette.border.light,
    borderRadius: theme.shape.borderRadius,
    backgroundColor: theme.palette.background.main,
    p: theme.spacing(30),
  };

  return (
    <>
      {checks?.length === 0 && selectedMonitor === "0" ? (
        <Box sx={{ ...sharedStyles }}>
          <Typography textAlign="center" color={theme.palette.text.secondary}>
            No incidents recorded yet.
          </Typography>
        </Box>
      ) : checks?.length === 0 ? (
        <Box sx={{ ...sharedStyles }}>
          <Typography textAlign="center" color={theme.palette.text.secondary}>
            The monitor you have selected has no recorded incidents yet.
          </Typography>
        </Box>
      ) : (
        <>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Monitor Name</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Date & Time</TableCell>
                  <TableCell>Status Code</TableCell>
                  <TableCell>Message</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {checks.map((check) => {
                  const status = check.status === true ? "up" : "down";

                  return (
                    <TableRow key={check._id}>
                      <TableCell>{monitors[check.monitorId]?.name}</TableCell>
                      <TableCell>
                        <StatusLabel
                          status={status}
                          text={status}
                          customStyles={{ textTransform: "capitalize" }}
                        />
                      </TableCell>
                      <TableCell>
                        {new Date(check.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {check.statusCode ? check.statusCode : "N/A"}
                      </TableCell>
                      <TableCell>{check.message}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
          {paginationComponent}
        </>
      )}
    </>
  );
};

IncidentTable.propTypes = {
  monitors: PropTypes.object.isRequired,
  selectedMonitor: PropTypes.string.isRequired,
  filter: PropTypes.string.isRequired,
};

export default IncidentTable;
